using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketingBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/booking
        [HttpPost]
        public async Task<IActionResult> PostBooking([FromBody] Booking booking)
        {
            Console.WriteLine($"[PostBooking] Received: UserEmail='{booking.UserEmail}', BusName='{booking.BusName}', Seats='{booking.Seats}', Method='{booking.PaymentMethod}', Date='{booking.JourneyDate}'");
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(x => x.Errors)
                    .Select(x => x.ErrorMessage));
                Console.WriteLine($"[PostBooking] Model state invalid: {errors}");
                return BadRequest(ModelState);
            }

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            Console.WriteLine($"[PostBooking] Successfully saved booking ID {booking.Id}");

            return Ok(new { message = "Booking logged successfully!", booking });
        }

        // GET: api/booking/user
        [HttpGet("user")]
        public async Task<IActionResult> GetUserBookings([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "User email is required." });
            }

            var allBookings = await _context.Bookings.ToListAsync();
            Console.WriteLine($"[GetUserBookings] Requested: '{email}'. Total bookings in DB: {allBookings.Count}");
            foreach (var b in allBookings)
            {
                Console.WriteLine($" - ID: {b.Id}, Email: '{b.UserEmail}', Bus: {b.BusName}, Seats: {b.Seats}");
            }

            var bookings = await _context.Bookings
                .Where(b => b.UserEmail == email)
                .OrderByDescending(b => b.TicketIssuingTime)
                .ToListAsync();

            foreach (var b in bookings)
            {
                b.TicketIssuingTime = DateTime.SpecifyKind(b.TicketIssuingTime, DateTimeKind.Utc);
            }

            return Ok(bookings);
        }

        // GET: api/booking
        [HttpGet]
        public async Task<IActionResult> GetAllBookings()
        {
            var bookings = await _context.Bookings.ToListAsync();
            var users = await _context.Users.ToListAsync();

            var result = bookings.Select(b => {
                var user = users.FirstOrDefault(u => u.Email == b.UserEmail);
                
                string computedStatus = b.Status;
                if (computedStatus != "Cancelled")
                {
                    var journeyDateTime = ParseJourneyDateTime(b.JourneyDate, b.DepartureTime);
                    if (journeyDateTime != null)
                    {
                        DateTime nowBangladesh = DateTime.UtcNow.AddHours(6);
                        if (journeyDateTime.Value <= nowBangladesh)
                        {
                            computedStatus = "Completed";
                        }
                        else
                        {
                            computedStatus = "Upcoming";
                        }
                    }
                    else
                    {
                        computedStatus = "Upcoming";
                    }
                }

                return new {
                    b.Id,
                    Username = user != null ? user.Username : b.UserEmail,
                    b.JourneyDate,
                    IssueDate = DateTime.SpecifyKind(b.TicketIssuingTime, DateTimeKind.Utc),
                    b.BusName,
                    b.FromDistrict,
                    b.ToDistrict,
                    b.Seats,
                    b.PaymentMethod,
                    b.DepartureTime,
                    Status = computedStatus
                };
            }).OrderByDescending(r => r.IssueDate).ToList();

            return Ok(result);
        }

        // POST: api/booking/cancel/{id}
        [HttpPost("cancel/{id}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            Console.WriteLine($"[CancelBooking] Request received for Booking ID {id}");
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound(new { message = "Booking record not found." });
            }

            var bus = await _context.Buses.FindAsync(booking.BusId);
            if (bus == null)
            {
                return NotFound(new { message = "Corresponding bus record not found." });
            }

            // Parse dates and validate 12-hour limit
            string departureTime = string.IsNullOrEmpty(booking.DepartureTime) ? bus.DepartureTime : booking.DepartureTime;
            var journeyDateTime = ParseJourneyDateTime(booking.JourneyDate, departureTime);
            if (journeyDateTime == null)
            {
                return BadRequest(new { message = "Could not parse journey date or departure time." });
            }

            DateTime nowBangladesh = DateTime.UtcNow.AddHours(6);
            var timeDifference = journeyDateTime.Value - nowBangladesh;

            if (timeDifference.TotalSeconds <= 0)
            {
                return BadRequest(new { message = "Cannot cancel an expired or completed journey." });
            }

            if (timeDifference.TotalHours < 12)
            {
                return BadRequest(new { message = "Cancellation must be done at least 12 hours prior to the journey departure time." });
            }

            // Restore seats on the bus
            var cancelledSeats = booking.Seats.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                              .Select(s => s.Trim())
                                              .ToList();

            var currentBookedSeats = (bus.BookedSeats ?? "").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                    .Select(s => s.Trim())
                                                    .ToList();

            var updatedBookedSeats = currentBookedSeats.Where(s => !cancelledSeats.Contains(s)).ToList();

            bus.BookedSeats = string.Join(", ", updatedBookedSeats);
            bus.AvailableSeats = Math.Min(40, bus.AvailableSeats + cancelledSeats.Count);

            // Update status of the booking record to Cancelled
            booking.Status = "Cancelled";
            _context.Bookings.Update(booking);

            await _context.SaveChangesAsync();
            Console.WriteLine($"[CancelBooking] Successfully cancelled Booking ID {id}. Restored seats: {string.Join(", ", cancelledSeats)} on Bus ID {bus.Id}");

            return Ok(new { message = "Your Cancellation is Successful! Your payment for ticket booking will be refunded within 12 hours." });
        }

        private static DateTime? ParseJourneyDateTime(string dateStr, string timeStr)
        {
            try
            {
                string format = "d/M/yy h:mm tt";
                string combined = $"{dateStr.Trim()} {timeStr.Trim()}";
                return DateTime.ParseExact(combined, format, System.Globalization.CultureInfo.InvariantCulture);
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
