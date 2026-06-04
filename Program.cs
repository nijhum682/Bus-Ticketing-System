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
}

app.MapControllers();

app.Run();
