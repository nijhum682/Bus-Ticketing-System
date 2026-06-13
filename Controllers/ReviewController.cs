using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketingBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/review
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews()
        {
            return await _context.Reviews
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/review/user/reviewed?email=user@example.com
        [HttpGet("user/reviewed")]
        public async Task<ActionResult<IEnumerable<int>>> GetUserReviewedBookingIds([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "Email query parameter is required." });
            }

            var reviewedIds = await _context.Reviews
                .Where(r => r.UserEmail.ToLower() == email.ToLower())
                .Select(r => r.BookingId)
                .ToListAsync();

            return Ok(reviewedIds);
        }

        // GET: api/review/booking/{bookingId}
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<Review>> GetReviewByBookingId(int bookingId)
        {
            var review = (await _context.Reviews.Where(r => r.BookingId == bookingId).ToListAsync()).FirstOrDefault();
            if (review == null)
            {
                return NotFound(new { message = "Review not found for this booking." });
            }
            return Ok(review);
        }

        // POST: api/review
        [HttpPost]
        public async Task<ActionResult<Review>> PostReview([FromBody] Review review)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if booking exists
            var booking = await _context.Bookings.FindAsync(review.BookingId);
            if (booking == null)
            {
                return NotFound(new { message = "Booking not found." });
            }

            // Ensure booking is not already reviewed
            var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.BookingId == review.BookingId);
            if (alreadyReviewed)
            {
                return BadRequest(new { message = "You have already submitted a review for this journey." });
            }

            // Optional: check if journey is completed
            // (We also do this client-side, but server-side checks add robustness)

            // Auto-populate fields from booking just to be secure and accurate
            review.UserEmail = booking.UserEmail;
            review.BusOperator = booking.BusName;
            review.Route = $"{booking.FromDistrict} -> {booking.ToDistrict}";
            review.JourneyDate = booking.JourneyDate;
            review.CreatedAt = DateTime.UtcNow;

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetReviews), new { id = review.Id }, review);
        }
    }
}
