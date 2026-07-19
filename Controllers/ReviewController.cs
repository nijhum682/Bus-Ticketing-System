using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Oracle.ManagedDataAccess.Client;
using System.Data;
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
        // Calls procedure: GET_REVIEWS
        [HttpGet]
        public async Task<IActionResult> GetReviews()
        {
            var connection = _context.Database.GetDbConnection();
            bool opened = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    opened = true;
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN GET_REVIEWS(:p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var reviews = new List<Review>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            reviews.Add(new Review
                            {
                                Id          = Convert.ToInt32(reader["ID"]),
                                UserEmail   = reader["USEREMAIL"].ToString() ?? "",
                                BookingId   = Convert.ToInt32(reader["BOOKINGID"]),
                                BusOperator = reader["BUSOPERATOR"].ToString() ?? "",
                                Route       = reader["ROUTE"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Rating      = Convert.ToInt32(reader["RATING"]),
                                Comment     = reader["COMMENT"].ToString() ?? "",
                                CreatedAt   = DateTime.SpecifyKind(Convert.ToDateTime(reader["CREATEDAT"]), DateTimeKind.Utc)
                            });
                        }
                    }
                    return Ok(reviews);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/review/sp
        // Calls procedure: SP_GET_REVIEWS_CURSOR (explicit named cursor procedure)
        [HttpGet("sp")]
        public async Task<IActionResult> GetReviewsSp()
        {
            var connection = _context.Database.GetDbConnection();
            bool opened = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    opened = true;
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN SP_GET_REVIEWS_CURSOR(:p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var reviews = new List<Review>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            reviews.Add(new Review
                            {
                                Id          = Convert.ToInt32(reader["ID"]),
                                UserEmail   = reader["USEREMAIL"].ToString() ?? "",
                                BookingId   = Convert.ToInt32(reader["BOOKINGID"]),
                                BusOperator = reader["BUSOPERATOR"].ToString() ?? "",
                                Route       = reader["ROUTE"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Rating      = Convert.ToInt32(reader["RATING"]),
                                Comment     = reader["COMMENT"].ToString() ?? "",
                                CreatedAt   = DateTime.SpecifyKind(Convert.ToDateTime(reader["CREATEDAT"]), DateTimeKind.Utc)
                            });
                        }
                    }
                    return Ok(reviews);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/review/{id}
        // Calls procedure: GET_REVIEW_BY_ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReviewById(int id)
        {
            var connection = _context.Database.GetDbConnection();
            bool opened = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    opened = true;
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN GET_REVIEW_BY_ID(:p_id, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_id", OracleDbType.Decimal, id, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var review = new Review
                            {
                                Id          = Convert.ToInt32(reader["ID"]),
                                UserEmail   = reader["USEREMAIL"].ToString() ?? "",
                                BookingId   = Convert.ToInt32(reader["BOOKINGID"]),
                                BusOperator = reader["BUSOPERATOR"].ToString() ?? "",
                                Route       = reader["ROUTE"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Rating      = Convert.ToInt32(reader["RATING"]),
                                Comment     = reader["COMMENT"].ToString() ?? "",
                                CreatedAt   = DateTime.SpecifyKind(Convert.ToDateTime(reader["CREATEDAT"]), DateTimeKind.Utc)
                            };
                            return Ok(review);
                        }
                    }
                    return NotFound(new { message = "Review not found." });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/review/user
        // Calls procedure: GET_USER_REVIEWS
        [HttpGet("user")]
        public async Task<IActionResult> GetReviewsByUser([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "Email query parameter is required." });
            }

            var connection = _context.Database.GetDbConnection();
            bool opened = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    opened = true;
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN GET_USER_REVIEWS(:p_email, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_email", OracleDbType.Varchar2, email, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var reviews = new List<Review>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            reviews.Add(new Review
                            {
                                Id          = Convert.ToInt32(reader["ID"]),
                                UserEmail   = reader["USEREMAIL"].ToString() ?? "",
                                BookingId   = Convert.ToInt32(reader["BOOKINGID"]),
                                BusOperator = reader["BUSOPERATOR"].ToString() ?? "",
                                Route       = reader["ROUTE"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Rating      = Convert.ToInt32(reader["RATING"]),
                                Comment     = reader["COMMENT"].ToString() ?? "",
                                CreatedAt   = DateTime.SpecifyKind(Convert.ToDateTime(reader["CREATEDAT"]), DateTimeKind.Utc)
                            });
                        }
                    }
                    return Ok(reviews);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/review/user/reviewed?email=user@example.com
        [HttpGet("user/reviewed")]
        public async Task<ActionResult<IEnumerable<int>>> GetUserReviewedBookingIds([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "Email query parameter is required." });
            }

            // Calls GET_USER_REVIEWS to get booking IDs of reviewed booking
            var connection = _context.Database.GetDbConnection();
            bool opened = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    opened = true;
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN GET_USER_REVIEWS(:p_email, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_email", OracleDbType.Varchar2, email, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var reviewedBookingIds = new List<int>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            reviewedBookingIds.Add(Convert.ToInt32(reader["BOOKINGID"]));
                        }
                    }
                    return Ok(reviewedBookingIds);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
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
        // Calls procedure: ADD_REVIEW
        [HttpPost]
        public async Task<ActionResult<Review>> PostReview([FromBody] Review review)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get the booking details using GET_BOOKING_BY_ID procedure
            Booking booking = null;
            var connection = _context.Database.GetDbConnection();
            bool opened = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    opened = true;
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN GET_BOOKING_BY_ID(:p_id, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_id", OracleDbType.Decimal, review.BookingId, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            booking = new Booking
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                UserEmail = reader["USEREMAIL"].ToString() ?? "",
                                BusName = reader["BUSNAME"].ToString() ?? "",
                                FromDistrict = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? ""
                            };
                        }
                    }
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }

            if (booking == null)
            {
                return NotFound(new { message = "Booking not found." });
            }

            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN ADD_REVIEW(:p_user_email, :p_booking_id, :p_bus_operator, :p_route, :p_journey_date, :p_rating, :p_comment, :p_result); END;",
                new OracleParameter("p_user_email", booking.UserEmail),
                new OracleParameter("p_booking_id", OracleDbType.Decimal, review.BookingId, ParameterDirection.Input),
                new OracleParameter("p_bus_operator", booking.BusName),
                new OracleParameter("p_route", $"{booking.FromDistrict} -> {booking.ToDistrict}"),
                new OracleParameter("p_journey_date", booking.JourneyDate),
                new OracleParameter("p_rating", OracleDbType.Decimal, review.Rating, ParameterDirection.Input),
                new OracleParameter("p_comment", review.Comment),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }
    }
}
