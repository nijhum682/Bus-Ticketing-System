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

            if (!string.IsNullOrEmpty(date))
            {
                await EnsureDateBusesCloned(date);
            }

            var dbBuses = await _context.Buses
                .Where(b => b.FromDistrict == from && b.ToDistrict == to && b.JourneyDate == date)
                .ToListAsync();

            // Sort by departure time for cleaner presentation
            var sortedBuses = dbBuses.OrderBy(b => b.DepartureTime).ToList();
            return Ok(sortedBuses);
        }

        // GET: api/bus
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Bus>>> GetBuses([FromQuery] string? date)
        {
            if (string.IsNullOrEmpty(date))
            {
                // If date is not specified, return template buses
                return await _context.Buses
                    .Where(b => b.JourneyDate == "")
                    .OrderBy(b => b.Operator)
                    .ToListAsync();
            }

            await EnsureDateBusesCloned(date);

            return await _context.Buses
                .Where(b => b.JourneyDate == date)
                .OrderBy(b => b.Operator)
                .ToListAsync();
        }

        // POST: api/bus
        [HttpPost]
        public async Task<ActionResult<Bus>> PostBus([FromBody] Bus bus)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            bus.FromDistrict = StandardizeLocation(bus.FromDistrict);
            bus.ToDistrict = StandardizeLocation(bus.ToDistrict);

            if (bus.Fare <= 0)
            {
                bus.Fare = GeoUtils.CalculateFare(bus.FromDistrict, bus.ToDistrict, bus.BusType);
            }

            _context.Buses.Add(bus);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBuses), new { id = bus.Id }, bus);
        }

        // PUT: api/bus/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBus(int id, [FromBody] Bus bus)
        {
            if (id != bus.Id)
            {
                return BadRequest(new { message = "Bus ID mismatch." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            bus.FromDistrict = StandardizeLocation(bus.FromDistrict);
            bus.ToDistrict = StandardizeLocation(bus.ToDistrict);

            if (bus.Fare <= 0)
            {
                bus.Fare = GeoUtils.CalculateFare(bus.FromDistrict, bus.ToDistrict, bus.BusType);
            }

            _context.Entry(bus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await BusExists(id))
                {
                    return NotFound(new { message = "Bus not found." });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Bus updated successfully!", bus });
        }

        // DELETE: api/bus/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBus(int id)
        {
            var bus = await _context.Buses.FindAsync(id);
            if (bus == null)
            {
                return NotFound(new { message = "Bus not found." });
            }

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bus deleted successfully!" });
        }

        private async Task EnsureDateBusesCloned(string date)
        {
            if (string.IsNullOrEmpty(date)) return;

            // Check if we already have buses for this date
            var count = await _context.Buses.CountAsync(b => b.JourneyDate == date);
            
            // Get template count
            var templateCount = await _context.Buses.CountAsync(b => b.JourneyDate == "");
            
            if (count < templateCount)
            {
                if (count == 0)
                {
                    var templates = await _context.Buses.Where(b => b.JourneyDate == "").ToListAsync();
                    if (templates.Count > 0)
                    {
                        var newBuses = templates.Select(b => new Bus
                        {
                            Operator = b.Operator,
                            BusType = b.BusType,
                            DepartureTime = b.DepartureTime,
                            Fare = b.Fare,
                            AvailableSeats = b.AvailableSeats,
                            FromDistrict = b.FromDistrict,
                            ToDistrict = b.ToDistrict,
                            JourneyDate = date,
                            BookedSeats = ""
                        }).ToList();

                        const int batchSize = 2000;
                        for (int k = 0; k < newBuses.Count; k += batchSize)
                        {
                            var batch = newBuses.Skip(k).Take(batchSize).ToList();
                            _context.Buses.AddRange(batch);
                            await _context.SaveChangesAsync();
                            _context.ChangeTracker.Clear();
                        }
                    }
                }
                else
                {
                    // If count > 0 but less than templateCount, find missing template schedules and clone them
                    var existingBuses = await _context.Buses
                        .Where(b => b.JourneyDate == date)
                        .Select(b => new { b.Operator, b.BusType, b.FromDistrict, b.ToDistrict, b.DepartureTime })
                        .ToListAsync();

                    var existingKeys = new HashSet<string>(
                        existingBuses.Select(b => $"{b.Operator}_{b.BusType}_{b.FromDistrict}_{b.ToDistrict}_{b.DepartureTime}")
                    );

                    var templates = await _context.Buses.Where(b => b.JourneyDate == "").ToListAsync();
                    var missingTemplates = templates.Where(b => 
                        !existingKeys.Contains($"{b.Operator}_{b.BusType}_{b.FromDistrict}_{b.ToDistrict}_{b.DepartureTime}")
                    ).ToList();

                    if (missingTemplates.Count > 0)
                    {
                        var newBuses = missingTemplates.Select(b => new Bus
                        {
                            Operator = b.Operator,
                            BusType = b.BusType,
                            DepartureTime = b.DepartureTime,
                            Fare = b.Fare,
                            AvailableSeats = b.AvailableSeats,
                            FromDistrict = b.FromDistrict,
                            ToDistrict = b.ToDistrict,
                            JourneyDate = date,
                            BookedSeats = ""
                        }).ToList();

                        const int batchSize = 2000;
                        for (int k = 0; k < newBuses.Count; k += batchSize)
                        {
                            var batch = newBuses.Skip(k).Take(batchSize).ToList();
                            _context.Buses.AddRange(batch);
                            await _context.SaveChangesAsync();
                            _context.ChangeTracker.Clear();
                        }
                    }
                }
            }
        }

        private async Task<bool> BusExists(int id)
        {
            return await _context.Buses.AnyAsync(e => e.Id == id);
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
