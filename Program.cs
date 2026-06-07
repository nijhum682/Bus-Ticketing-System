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

app.UseHttpsRedirection();

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
                `ToDistrict` VARCHAR(100) NOT NULL
            );
        ");

        // 5. Seed default buses if empty
        var anyBuses = await context.Buses.AnyAsync();
        if (!anyBuses)
        {
            context.Buses.AddRange(new[]
            {
                new BusTicketingBackend.Models.Bus { Operator = "Green Line", BusType = "AC", DepartureTime = "09:30 AM", Fare = 1500, AvailableSeats = 24, FromDistrict = "Dhaka", ToDistrict = "Chattogram" },
                new BusTicketingBackend.Models.Bus { Operator = "Hanif Enterprise", BusType = "Non-AC", DepartureTime = "08:00 AM", Fare = 800, AvailableSeats = 32, FromDistrict = "Dhaka", ToDistrict = "Chattogram" },
                new BusTicketingBackend.Models.Bus { Operator = "Shyamoli Paribahan", BusType = "Non-AC", DepartureTime = "11:00 AM", Fare = 800, AvailableSeats = 28, FromDistrict = "Dhaka", ToDistrict = "Chattogram" },
                new BusTicketingBackend.Models.Bus { Operator = "Ena Transport", BusType = "AC", DepartureTime = "02:30 PM", Fare = 1400, AvailableSeats = 18, FromDistrict = "Dhaka", ToDistrict = "Chattogram" },

                new BusTicketingBackend.Models.Bus { Operator = "Green Line", BusType = "Sleeper Class", DepartureTime = "10:00 PM", Fare = 2500, AvailableSeats = 12, FromDistrict = "Dhaka", ToDistrict = "Cox's Bazar" },
                new BusTicketingBackend.Models.Bus { Operator = "Hanif Enterprise", BusType = "AC", DepartureTime = "10:30 PM", Fare = 1800, AvailableSeats = 20, FromDistrict = "Dhaka", ToDistrict = "Cox's Bazar" },
                new BusTicketingBackend.Models.Bus { Operator = "Saintmartin Travels", BusType = "AC", DepartureTime = "11:00 PM", Fare = 1600, AvailableSeats = 22, FromDistrict = "Dhaka", ToDistrict = "Cox's Bazar" },

                new BusTicketingBackend.Models.Bus { Operator = "Ena Transport", BusType = "Non-AC", DepartureTime = "07:00 AM", Fare = 600, AvailableSeats = 35, FromDistrict = "Dhaka", ToDistrict = "Sylhet" },
                new BusTicketingBackend.Models.Bus { Operator = "Green Line", BusType = "AC", DepartureTime = "08:30 AM", Fare = 1200, AvailableSeats = 26, FromDistrict = "Dhaka", ToDistrict = "Sylhet" },
                new BusTicketingBackend.Models.Bus { Operator = "Shyamoli Paribahan", BusType = "Non-AC", DepartureTime = "01:30 PM", Fare = 600, AvailableSeats = 30, FromDistrict = "Dhaka", ToDistrict = "Sylhet" },

                new BusTicketingBackend.Models.Bus { Operator = "National Travels", BusType = "AC", DepartureTime = "09:00 AM", Fare = 1000, AvailableSeats = 24, FromDistrict = "Dhaka", ToDistrict = "Rajshahi" },
                new BusTicketingBackend.Models.Bus { Operator = "Hanif Enterprise", BusType = "Non-AC", DepartureTime = "02:00 PM", Fare = 700, AvailableSeats = 36, FromDistrict = "Dhaka", ToDistrict = "Rajshahi" },

                new BusTicketingBackend.Models.Bus { Operator = "Sohogh Paribahan", BusType = "AC", DepartureTime = "08:00 AM", Fare = 1300, AvailableSeats = 15, FromDistrict = "Dhaka", ToDistrict = "Khulna" },
                new BusTicketingBackend.Models.Bus { Operator = "Hanif Enterprise", BusType = "Non-AC", DepartureTime = "10:00 AM", Fare = 800, AvailableSeats = 34, FromDistrict = "Dhaka", ToDistrict = "Khulna" },

                new BusTicketingBackend.Models.Bus { Operator = "Hanif Enterprise", BusType = "Non-AC", DepartureTime = "08:00 AM", Fare = 800, AvailableSeats = 30, FromDistrict = "Chattogram", ToDistrict = "Dhaka" },
                new BusTicketingBackend.Models.Bus { Operator = "Green Line", BusType = "AC", DepartureTime = "09:30 AM", Fare = 1500, AvailableSeats = 22, FromDistrict = "Chattogram", ToDistrict = "Dhaka" },

                new BusTicketingBackend.Models.Bus { Operator = "Ena Transport", BusType = "Non-AC", DepartureTime = "07:00 AM", Fare = 600, AvailableSeats = 31, FromDistrict = "Sylhet", ToDistrict = "Dhaka" },
                new BusTicketingBackend.Models.Bus { Operator = "Green Line", BusType = "AC", DepartureTime = "08:30 AM", Fare = 1200, AvailableSeats = 25, FromDistrict = "Sylhet", ToDistrict = "Dhaka" },

                new BusTicketingBackend.Models.Bus { Operator = "Green Line", BusType = "Sleeper Class", DepartureTime = "10:00 PM", Fare = 2500, AvailableSeats = 14, FromDistrict = "Cox's Bazar", ToDistrict = "Dhaka" },
                new BusTicketingBackend.Models.Bus { Operator = "Hanif Enterprise", BusType = "AC", DepartureTime = "10:30 PM", Fare = 1800, AvailableSeats = 19, FromDistrict = "Cox's Bazar", ToDistrict = "Dhaka" }
            });
            await context.SaveChangesAsync();
            Console.WriteLine("Seeded default buses in Buses database table.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error during startup buses database setup: " + ex.Message);
    }
}

app.MapControllers();

app.Run();
