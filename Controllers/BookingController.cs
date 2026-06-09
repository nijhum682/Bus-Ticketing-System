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

            return Ok(bookings);
        }
    }
}
