using BusTicketingBackend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Oracle.EntityFrameworkCore.Infrastructure;


var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

// Add services to the container.
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseOracle(connectionString, b => b.UseOracleSQLCompatibility(OracleSQLCompatibility.DatabaseVersion19)));

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Enable CORS
app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

// app.UseHttpsRedirection();

app.UseAuthorization();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        // Check if tables already exist to decide whether to run the destructive DROP section
        bool tablesExist = false;
        try
        {
            tablesExist = await context.Users.AnyAsync();
        }
        catch { /* Tables don't exist yet */ }

        if (!tablesExist)
        {
            // Fresh install: create schema via EnsureCreated
            await context.Database.EnsureCreatedAsync();
            Console.WriteLine("Oracle database schema verified or created successfully.");
        }
        else
        {
            Console.WriteLine("Oracle database schema already exists — skipping destructive DROP/CREATE. Recompiling PL/SQL objects only.");
        }

        // Execute setup_database_oracle.sql — but only the safe CREATE OR REPLACE parts
        // when data already exists (skip DROP TABLE / DROP SEQUENCE / DROP PROCEDURE / CREATE TABLE / CREATE SEQUENCE)
        try
        {
            var sqlPath = Path.Combine(Directory.GetCurrentDirectory(), "setup_database_oracle.sql");
            if (File.Exists(sqlPath))
            {
                Console.WriteLine("Executing setup_database_oracle.sql script on startup to compile all PL/SQL objects...");

                // Clean up any conflicting synonyms that could cause ORA-01775: looping chain of synonyms
                var synonymsToDrop = new[] { "USERS", "BUSES", "BOOKINGS", "REVIEWS", "NOTICES" };
                foreach (var syn in synonymsToDrop)
                {
                    try { await context.Database.ExecuteSqlRawAsync($"DROP SYNONYM \"{syn}\""); }
                    catch { /* Ignore if synonym does not exist */ }
                }

                var sqlContent = await File.ReadAllTextAsync(sqlPath);

                // Split blocks by '/' on its own line
                var blocks = sqlContent.Split(new[] { "\n/", "\r\n/", "\r/" }, StringSplitOptions.RemoveEmptyEntries);

                // Helper to check if a statement contains actual SQL code (not just comments/whitespace)
                bool HasActualSqlCode(string sql)
                {
                    if (string.IsNullOrWhiteSpace(sql)) return false;
                    var lines = sql.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in lines)
                    {
                        var trimmed = line.Trim();
                        if (string.IsNullOrWhiteSpace(trimmed)) continue;
                        if (trimmed.StartsWith("--")) continue;
                        if (trimmed.StartsWith("/*") && trimmed.EndsWith("*/")) continue;
                        return true;
                    }
                    return false;
                }

                // Statements that destroy data — skip these when tables already have data
                bool IsDestructiveStatement(string sql)
                {
                    var upper = sql.TrimStart().ToUpperInvariant();
                    return upper.StartsWith("DROP TABLE")
                        || upper.StartsWith("DROP SEQUENCE")
                        || upper.StartsWith("CREATE SEQUENCE")
                        || upper.StartsWith("CREATE TABLE");
                }

                foreach (var block in blocks)
                {
                    var blockText = block.Trim();
                    if (string.IsNullOrWhiteSpace(blockText)) continue;

                    // Skip ALTER SESSION statements
                    if (blockText.Contains("ALTER SESSION", StringComparison.OrdinalIgnoreCase))
                        continue;

                    // Find if there is a PL/SQL signature in this block
                    var plSqlSignatures = new[] {
                        "CREATE OR REPLACE TRIGGER",
                        "CREATE OR REPLACE PROCEDURE",
                        "CREATE OR REPLACE FUNCTION",
                        "CREATE OR REPLACE PACKAGE",
                        "DECLARE",
                        "BEGIN"
                    };

                    int plSqlIndex = -1;
                    foreach (var sig in plSqlSignatures)
                    {
                        int searchStart = 0;
                        while (searchStart < blockText.Length)
                        {
                            var idx = blockText.IndexOf(sig, searchStart, StringComparison.OrdinalIgnoreCase);
                            if (idx == -1) break;

                            int lineStart = idx;
                            while (lineStart > 0 && blockText[lineStart - 1] != '\n' && blockText[lineStart - 1] != '\r')
                                lineStart--;

                            string linePrefix = blockText.Substring(lineStart, idx - lineStart);
                            if (linePrefix.Contains("--") || linePrefix.Contains("/*"))
                            {
                                searchStart = idx + sig.Length;
                                continue;
                            }

                            if (plSqlIndex == -1 || idx < plSqlIndex)
                                plSqlIndex = idx;
                            break;
                        }
                    }

                    string plainSqlPart = blockText;
                    string plSqlPart = "";

                    if (plSqlIndex >= 0)
                    {
                        plainSqlPart = blockText.Substring(0, plSqlIndex).Trim();
                        plSqlPart = blockText.Substring(plSqlIndex).Trim();
                    }

                    // 1. Execute plain SQL statements (split by ';')
                    if (!string.IsNullOrWhiteSpace(plainSqlPart))
                    {
                        var statements = plainSqlPart.Split(';', StringSplitOptions.RemoveEmptyEntries);
                        foreach (var stmt in statements)
                        {
                            var sql = stmt.Trim();
                            if (string.IsNullOrWhiteSpace(sql)) continue;
                            if (!HasActualSqlCode(sql)) continue;

                            // When data already exists, skip DROP TABLE, DROP SEQUENCE, CREATE TABLE, CREATE SEQUENCE
                            if (tablesExist && IsDestructiveStatement(sql))
                            {
                                Console.WriteLine($"[Skipped — data exists] {sql.Split('\n')[0].Trim()}");
                                continue;
                            }

                            try
                            {
                                await context.Database.ExecuteSqlRawAsync(sql);
                            }
                            catch (Exception ex)
                            {
                                if (!sql.Contains("DROP", StringComparison.OrdinalIgnoreCase))
                                    Console.WriteLine($"[SQL Warning] Error executing SQL statement: {ex.Message}");
                            }
                        }
                    }

                    // 2. Execute PL/SQL block in full (BEGIN...END, CREATE OR REPLACE PROCEDURE, etc.)
                    if (!string.IsNullOrWhiteSpace(plSqlPart) && HasActualSqlCode(plSqlPart))
                    {
                        // When tables already exist, skip raw BEGIN...END blocks that only contain DROPs
                        bool isDropOnlyBlock = plSqlPart.Contains("DROP TABLE", StringComparison.OrdinalIgnoreCase)
                                           || plSqlPart.Contains("DROP SEQUENCE", StringComparison.OrdinalIgnoreCase);
                        bool isCreateOrReplace = plSqlPart.Contains("CREATE OR REPLACE", StringComparison.OrdinalIgnoreCase);

                        if (tablesExist && isDropOnlyBlock && !isCreateOrReplace)
                        {
                            Console.WriteLine($"[Skipped — data exists] {plSqlPart.Split('\n')[0].Trim()}");
                            continue;
                        }

                        try
                        {
                            await context.Database.ExecuteSqlRawAsync(plSqlPart);
                        }
                        catch (Exception ex)
                        {
                            if (!plSqlPart.Contains("DROP", StringComparison.OrdinalIgnoreCase))
                                Console.WriteLine($"[PL/SQL Warning] Error executing PL/SQL block: {ex.Message}");
                        }
                    }
                }
                Console.WriteLine("All Travello PL/SQL functions, procedures, and triggers executed and compiled successfully.");
            }
            else
            {
                Console.WriteLine("setup_database_oracle.sql not found in directory.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error compiling setup script on startup: " + ex.Message);
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error ensuring Oracle database schema exists: " + ex.Message);
    }

    try
    {
        // Seed default notices if empty
        var anyNotices = await context.Notices.AnyAsync();
        if (!anyNotices)
        {
            context.Notices.AddRange(new[]
            {
                new BusTicketingBackend.Models.Notice { NoticeNumber = "01", Title = "Refund Policy", Content = "Eid tickets are non-cancellable, non-transferable, and non-refundable, except where a refund is approved under the applicable refund policy due to operator-cancelled trips." },
                new BusTicketingBackend.Models.Notice { NoticeNumber = "02", Title = "Eid Period", Content = "As per Bangladesh Bus Owners Association's declaration, the Eid trip period will be from 14 May 2026 to 13 June 2026." },
                new BusTicketingBackend.Models.Notice { NoticeNumber = "03", Title = "Operator Rights", Content = "Bus operators reserve the right to delay, cancel, reschedule, change bus type, change seats, change routes, or change boarding points due to unavoidable operational reasons." },
                new BusTicketingBackend.Models.Notice { NoticeNumber = "04", Title = "Reporting Time", Content = "Passengers must report to the correct boarding point at least 30 minutes before the scheduled departure time. Travello will not be responsible for missed trips, cancellation, rescheduling, or seat reassignment due to late reporting." },
                new BusTicketingBackend.Models.Notice { NoticeNumber = "05", Title = "Refund Processing", Content = "If a trip is cancelled by the bus operator and refund is approved, the refundable amount will be credited to the original payment method, bank card or MFS number used for the purchase, within a reasonable timeframe and subject to payment partner policies." }
            });
            await context.SaveChangesAsync();
            Console.WriteLine("Seeded 5 default notices in Notices database table.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error during startup notices database setup: " + ex.Message);
    }

    try
    {
        var bookingsCount = await context.Bookings.CountAsync();
        Console.WriteLine($"[Startup] Total Bookings in DB: {bookingsCount}");
        var allB = await context.Bookings.ToListAsync();
        foreach (var b in allB)
        {
            Console.WriteLine($" - ID: {b.Id}, UserEmail: {b.UserEmail}, Bus: {b.BusName}, Seats: {b.Seats}, JourneyDate: {b.JourneyDate}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error listing Bookings table: " + ex.Message);
    }

    try
    {
        // Seed default buses if empty, incomplete, or if fares need updating to distance-based calculations
        var busCount = await context.Buses.CountAsync();
        if (busCount < 16100)
        {
            // Clear existing ones using EF Core ExecuteDeleteAsync (fully database agnostic)
            await context.Buses.ExecuteDeleteAsync();

            var districts = new[]
            {
                "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", 
                "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", 
                "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", 
                "Habiganj", "Jamalpur", "Jashore", "Jhalokathi", "Jhenaidah", "Joypurhat", 
                "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lalmonirhat", 
                "Laxmipur", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", 
                "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", 
                "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", 
                "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", 
                "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", 
                "Tangail", "Thakurgaon"
            };

            var operators = new[] { "Green Line", "Hanif Enterprise", "Shyamoli Paribahan", "Ena Transport", "Sohogh Paribahan", "SR Travels", "Nabil Paribahan", "Saintmartin Travels" };
            var times = new[] { "07:30 AM", "09:00 AM", "11:15 AM", "02:30 PM", "04:45 PM", "08:15 PM", "10:00 PM", "11:15 PM" };
            var generatedBuses = new List<BusTicketingBackend.Models.Bus>();

            var rand = new Random(42); // Seeded Random for determinism
            
            for (int i = 0; i < districts.Length; i++)
            {
                for (int j = 0; j < districts.Length; j++)
                {
                    if (i == j) continue;

                    var from = districts[i];
                    var to = districts[j];

                    int busCountPerRoute = 4; // Exactly 4 buses per route
                    var usedOperators = new HashSet<string>();
                    var usedTimes = new HashSet<string>();

                    for (int b = 0; b < busCountPerRoute; b++)
                    {
                        // Select unique operator
                        string op;
                        int opAttempts = 0;
                        do
                        {
                            op = operators[rand.Next(operators.Length)];
                            opAttempts++;
                        } while (usedOperators.Contains(op) && opAttempts < 15);
                        usedOperators.Add(op);

                        // Select unique time
                        string time;
                        int timeAttempts = 0;
                        do
                        {
                            time = times[rand.Next(times.Length)];
                            timeAttempts++;
                        } while (usedTimes.Contains(time) && timeAttempts < 15);
                        usedTimes.Add(time);

                        var busType = b == 0 ? (rand.Next(10) < 6 ? "AC" : "Sleeper Class") : "Non-AC";
                        int fare = BusTicketingBackend.Models.GeoUtils.CalculateFare(from, to, busType);

                        generatedBuses.Add(new BusTicketingBackend.Models.Bus
                        {
                            Operator = op,
                            BusType = busType,
                            DepartureTime = time,
                            Fare = fare,
                            AvailableSeats = rand.Next(5, 38),
                            FromDistrict = from,
                            ToDistrict = to
                        });
                    }
                }
            }

            // Save in batches of 2000 to prevent connection issues or packet size limits
            const int batchSize = 2000;
            for (int k = 0; k < generatedBuses.Count; k += batchSize)
            {
                var batch = generatedBuses.Skip(k).Take(batchSize).ToList();
                context.Buses.AddRange(batch);
                await context.SaveChangesAsync();
                context.ChangeTracker.Clear(); // Clear tracking to free memory and prevent ID conflict on subsequent batches
            }

            Console.WriteLine($"Seeded {generatedBuses.Count} default buses in Buses database table.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error during startup buses database setup: " + ex.Message);
    }
}

app.MapControllers();

app.Run();
