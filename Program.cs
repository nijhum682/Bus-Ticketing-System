using BusTicketingBackend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

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
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

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
        // 1. Add Role column to Users table if missing
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `Role` VARCHAR(50) NOT NULL DEFAULT 'User';");
        Console.WriteLine("Successfully added 'Role' column to 'Users' table.");
    }
    catch (Exception)
    {
        // Ignored if column already exists
    }

    try
    {
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PermanentDistrict` VARCHAR(100) NOT NULL DEFAULT '';");
        Console.WriteLine("Successfully added 'PermanentDistrict' column to 'Users' table.");
    }
    catch (Exception) {}

    try
    {
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `Gender` VARCHAR(20) NOT NULL DEFAULT '';");
        Console.WriteLine("Successfully added 'Gender' column to 'Users' table.");
    }
    catch (Exception) {}

    try
    {
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `Profession` VARCHAR(100) NOT NULL DEFAULT '';");
        Console.WriteLine("Successfully added 'Profession' column to 'Users' table.");
    }
    catch (Exception) {}

    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PresArea` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}
    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PresUpazilla` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}
    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PresDistrict` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}
    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PresDivision` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}
    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PermArea` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}
    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PermUpazilla` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}
    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Users` ADD COLUMN `PermDivision` VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception) {}

    try
    {
        // 2. Create Notices table if it doesn't exist
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS `Notices` (
                `Id` INT AUTO_INCREMENT PRIMARY KEY,
                `NoticeNumber` VARCHAR(10) NOT NULL,
                `Title` VARCHAR(100) NOT NULL,
                `Content` TEXT NOT NULL,
                `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // 3. Seed default notices if empty
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
        // Create Bookings table if it doesn't exist
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS `Bookings` (
                `Id` INT AUTO_INCREMENT PRIMARY KEY,
                `UserEmail` VARCHAR(100) NOT NULL,
                `BusId` INT NOT NULL,
                `BusName` VARCHAR(100) NOT NULL,
                `FromDistrict` VARCHAR(100) NOT NULL,
                `ToDistrict` VARCHAR(100) NOT NULL,
                `JourneyDate` VARCHAR(50) NOT NULL,
                `Seats` VARCHAR(100) NOT NULL,
                `PaymentMethod` VARCHAR(50) NOT NULL,
                `TicketIssuingTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
                `DepartureTime` VARCHAR(50) NOT NULL DEFAULT '',
                `Status` VARCHAR(50) NOT NULL DEFAULT 'Upcoming'
            );
        ");

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Bookings` ADD COLUMN `DepartureTime` VARCHAR(50) NOT NULL DEFAULT '';");
            Console.WriteLine("Successfully added 'DepartureTime' column to 'Bookings' table.");
        }
        catch (Exception) {}

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Bookings` ADD COLUMN `Status` VARCHAR(50) NOT NULL DEFAULT 'Upcoming';");
            Console.WriteLine("Successfully added 'Status' column to 'Bookings' table.");
        }
        catch (Exception) {}

        Console.WriteLine("Successfully verified or created Bookings table.");

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
        Console.WriteLine("Error verifying/creating Bookings table: " + ex.Message);
    }

    try
    {
        // 4. Create Buses table if it doesn't exist
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS `Buses` (
                `Id` INT AUTO_INCREMENT PRIMARY KEY,
                `Operator` VARCHAR(100) NOT NULL,
                `BusType` VARCHAR(50) NOT NULL,
                `DepartureTime` VARCHAR(50) NOT NULL,
                `Fare` INT NOT NULL,
                `AvailableSeats` INT NOT NULL,
                `FromDistrict` VARCHAR(100) NOT NULL,
                `ToDistrict` VARCHAR(100) NOT NULL,
                `BookedSeats` VARCHAR(500) NOT NULL DEFAULT ''
            );
        ");

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE `Buses` ADD COLUMN `BookedSeats` VARCHAR(500) NOT NULL DEFAULT '';");
        }
        catch (Exception) { }

        try
        {
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX `IX_Buses_FromDistrict_ToDistrict` ON `Buses` (`FromDistrict`, `ToDistrict`);");
        }
        catch (Exception) { }

        // 5. Seed default buses if empty, incomplete, or if fares need updating to distance-based calculations
        var busCount = await context.Buses.CountAsync();
        var firstBus = await context.Buses.FirstOrDefaultAsync();
        var needsReseed = firstBus == null || firstBus.Fare != BusTicketingBackend.Models.GeoUtils.CalculateFare(firstBus.FromDistrict, firstBus.ToDistrict, firstBus.BusType);
        if (busCount < 16100 || needsReseed)
        {
            // Clear existing ones to prevent duplicates
            await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE `Buses`;");

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
