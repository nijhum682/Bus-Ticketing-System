using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusTicketingBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BusController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BusController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchBuses([FromQuery] string from, [FromQuery] string to, [FromQuery] string date)
        {
            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(to))
            {
                return BadRequest(new { message = "From and To locations are required." });
            }

            // Standardize capitalization (first letter upper, rest lower)
            from = StandardizeLocation(from);
            to = StandardizeLocation(to);

            // 1. Check database first
            var dbBuses = await _context.Buses
                .Where(b => b.FromDistrict == from && b.ToDistrict == to)
                .ToListAsync();

            if (dbBuses.Count > 0)
            {
                return Ok(dbBuses);
            }

            // 2. Fallback: Deterministic generation of 3-5 realistic buses
            var combinedKey = $"{from.ToLowerInvariant()}_{to.ToLowerInvariant()}_{date}";
            int seed = 0;
            foreach (char c in combinedKey)
            {
                seed = (seed * 31) + c;
            }

            var rand = new Random(seed);
            int count = rand.Next(3, 6); // 3 to 5 buses

            var operators = new[] { "Hanif Enterprise", "Shyamoli Paribahan", "Ena Transport", "Green Line", "Sohogh Paribahan", "Saintmartin Travels", "Nabil Paribahan", "SR Travels" };
            var times = new[] { "07:30 AM", "09:00 AM", "11:15 AM", "02:30 PM", "04:45 PM", "08:15 PM", "10:30 PM", "11:15 PM" };
            
            var generatedBuses = new List<Bus>();
            var usedOperators = new HashSet<string>();
            var usedTimes = new HashSet<string>();

            // Base fare calculation logic based on simple character differences (districts distance representation)
            int charDiff = Math.Abs(from.Length - to.Length);
            int baseFare = 550 + (charDiff * 45); // deterministic base fare

            for (int i = 0; i < count; i++)
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

                // Determine bus type
                string busType;
                int typeRand = rand.Next(100);
                int fareModifier = 0;
                if (typeRand < 40)
                {
                    busType = "Non-AC";
                }
                else if (typeRand < 80)
                {
                    busType = "AC";
                    fareModifier = rand.Next(400, 700);
                }
                else
                {
                    busType = "Sleeper Class";
                    fareModifier = rand.Next(900, 1400);
                }

                generatedBuses.Add(new Bus
                {
                    Id = -(i + 1), // Negative ID to signify transient/generated
                    Operator = op,
                    BusType = busType,
                    DepartureTime = time,
                    Fare = baseFare + fareModifier,
                    AvailableSeats = rand.Next(4, 38),
                    FromDistrict = from,
                    ToDistrict = to
                });
            }

            // Sort by departure time for cleaner presentation
            var sortedBuses = generatedBuses.OrderBy(b => b.DepartureTime).ToList();
            return Ok(sortedBuses);
        }

        private string StandardizeLocation(string val)
        {
            if (string.IsNullOrWhiteSpace(val)) return string.Empty;
            val = val.Trim();
            if (val.Length == 1) return val.ToUpperInvariant();
            return char.ToUpperInvariant(val[0]) + val.Substring(1).ToLowerInvariant();
        }
    }
}
