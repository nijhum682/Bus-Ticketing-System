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
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/booking
        // Calls procedure: ADD_BOOKING
        [HttpPost]
        public async Task<IActionResult> PostBooking([FromBody] Booking booking)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN ADD_BOOKING(:p_user_email, :p_bus_id, :p_bus_name, :p_from_district, :p_to_district, :p_journey_date, :p_seats, :p_payment, :p_depart_time, :p_result); END;",
                new OracleParameter("p_user_email", booking.UserEmail),
                new OracleParameter("p_bus_id", booking.BusId),
                new OracleParameter("p_bus_name", booking.BusName),
                new OracleParameter("p_from_district", booking.FromDistrict),
                new OracleParameter("p_to_district", booking.ToDistrict),
                new OracleParameter("p_journey_date", booking.JourneyDate),
                new OracleParameter("p_seats", booking.Seats),
                new OracleParameter("p_payment", booking.PaymentMethod),
                new OracleParameter("p_depart_time", booking.DepartureTime ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            // Retrieve the saved booking
            var savedBooking = await _context.Bookings
                .Where(b => b.UserEmail == booking.UserEmail && b.BusId == booking.BusId)
                .OrderByDescending(b => b.TicketIssuingTime)
                .FirstOrDefaultAsync();

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim(), booking = savedBooking ?? booking });
        }

        // POST: api/booking/sp
        // Calls procedure: SP_ADD_BOOKING
        [HttpPost("sp")]
        public async Task<IActionResult> PostBookingSp([FromBody] Booking booking)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN SP_ADD_BOOKING(:p_user_email, :p_bus_id, :p_bus_name, :p_from_district, :p_to_district, :p_journey_date, :p_seats, :p_payment, :p_depart_time, :p_result); END;",
                new OracleParameter("p_user_email", booking.UserEmail),
                new OracleParameter("p_bus_id", booking.BusId),
                new OracleParameter("p_bus_name", booking.BusName),
                new OracleParameter("p_from_district", booking.FromDistrict),
                new OracleParameter("p_to_district", booking.ToDistrict),
                new OracleParameter("p_journey_date", booking.JourneyDate),
                new OracleParameter("p_seats", booking.Seats),
                new OracleParameter("p_payment", booking.PaymentMethod),
                new OracleParameter("p_depart_time", booking.DepartureTime ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // GET: api/booking/user?email=...
        // Calls procedure: SP_GET_USER_BOOKINGS
        [HttpGet("user")]
        public async Task<IActionResult> GetUserBookings([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "User email is required." });
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
                    command.CommandText = "BEGIN SP_GET_USER_BOOKINGS(:p_email, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_email", OracleDbType.Varchar2, email, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var bookings = new List<Booking>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var b = new Booking
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                BusName = reader["BUSNAME"].ToString() ?? "",
                                FromDistrict = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                DepartureTime = reader["DEPARTURETIME"].ToString() ?? "",
                                Seats = reader["SEATS"].ToString() ?? "",
                                PaymentMethod = reader["PAYMENTMETHOD"].ToString() ?? "",
                                TicketIssuingTime = DateTime.SpecifyKind(Convert.ToDateTime(reader["TICKETISSUINGTIME"]), DateTimeKind.Utc),
                                Status = reader["COMPUTED_STATUS"].ToString() ?? "",
                                UserEmail = email
                            };
                            bookings.Add(b);
                        }
                    }
                    return Ok(bookings);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/booking
        // Calls procedure: GET_ALL_BOOKINGS
        [HttpGet]
        public async Task<IActionResult> GetAllBookings()
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
                    command.CommandText = "BEGIN GET_ALL_BOOKINGS(:p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var rawBookings = new List<Booking>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            rawBookings.Add(new Booking
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                UserEmail = reader["USEREMAIL"].ToString() ?? "",
                                BusId = Convert.ToInt32(reader["BUSID"]),
                                BusName = reader["BUSNAME"].ToString() ?? "",
                                FromDistrict = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Seats = reader["SEATS"].ToString() ?? "",
                                PaymentMethod = reader["PAYMENTMETHOD"].ToString() ?? "",
                                TicketIssuingTime = Convert.ToDateTime(reader["TICKETISSUINGTIME"]),
                                DepartureTime = reader["DEPARTURETIME"].ToString() ?? "",
                                Status = reader["STATUS"].ToString() ?? "Upcoming"
                            });
                        }
                    }

                    // Get all users to map emails to usernames
                    var users = await _context.Users.ToListAsync();

                    var result = rawBookings.Select(b => new
                    {
                        b.Id,
                        Username = users.FirstOrDefault(u => u.Email.Equals(b.UserEmail, System.StringComparison.OrdinalIgnoreCase))?.Username ?? b.UserEmail,
                        b.JourneyDate,
                        IssueDate = DateTime.SpecifyKind(b.TicketIssuingTime, DateTimeKind.Utc),
                        b.BusName,
                        b.FromDistrict,
                        b.ToDistrict,
                        b.Seats,
                        b.PaymentMethod,
                        b.DepartureTime,
                        Status = b.Status
                    }).ToList();

                    return Ok(result);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/booking/{id}
        // Calls procedure: GET_BOOKING_BY_ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookingById(int id)
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
                    command.CommandText = "BEGIN GET_BOOKING_BY_ID(:p_id, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_id", OracleDbType.Decimal, id, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            return Ok(new
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                UserEmail = reader["USEREMAIL"].ToString() ?? "",
                                BusId = Convert.ToInt32(reader["BUSID"]),
                                BusName = reader["BUSNAME"].ToString() ?? "",
                                FromDistrict = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Seats = reader["SEATS"].ToString() ?? "",
                                PaymentMethod = reader["PAYMENTMETHOD"].ToString() ?? "",
                                TicketIssuingTime = DateTime.SpecifyKind(Convert.ToDateTime(reader["TICKETISSUINGTIME"]), DateTimeKind.Utc),
                                DepartureTime = reader["DEPARTURETIME"].ToString() ?? "",
                                Status = reader["STATUS"].ToString() ?? "Upcoming"
                            });
                        }
                    }
                    return NotFound(new { message = "Booking not found." });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/booking/by-status?status=Upcoming|Completed|Cancelled
        // Calls procedure: GET_BOOKINGS_BY_STATUS
        [HttpGet("by-status")]
        public async Task<IActionResult> GetBookingsByStatus([FromQuery] string status)
        {
            if (string.IsNullOrEmpty(status))
            {
                return BadRequest(new { message = "Status is required." });
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
                    command.CommandText = "BEGIN GET_BOOKINGS_BY_STATUS(:p_status, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_status", OracleDbType.Varchar2, status, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var rawBookings = new List<Booking>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            rawBookings.Add(new Booking
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                UserEmail = reader["USEREMAIL"].ToString() ?? "",
                                BusId = Convert.ToInt32(reader["BUSID"]),
                                BusName = reader["BUSNAME"].ToString() ?? "",
                                FromDistrict = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                Seats = reader["SEATS"].ToString() ?? "",
                                PaymentMethod = reader["PAYMENTMETHOD"].ToString() ?? "",
                                TicketIssuingTime = Convert.ToDateTime(reader["TICKETISSUINGTIME"]),
                                DepartureTime = reader["DEPARTURETIME"].ToString() ?? "",
                                Status = reader["STATUS"].ToString() ?? "Upcoming"
                            });
                        }
                    }

                    var users = await _context.Users.ToListAsync();
                    var result = rawBookings.Select(b => new
                    {
                        b.Id,
                        Username = users.FirstOrDefault(u => u.Email.Equals(b.UserEmail, System.StringComparison.OrdinalIgnoreCase))?.Username ?? b.UserEmail,
                        b.JourneyDate,
                        IssueDate = DateTime.SpecifyKind(b.TicketIssuingTime, DateTimeKind.Utc),
                        b.BusName,
                        b.FromDistrict,
                        b.ToDistrict,
                        b.Seats,
                        b.PaymentMethod,
                        b.DepartureTime,
                        Status = b.Status
                    }).ToList();

                    return Ok(result);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/booking/by-status-sp?status=Upcoming|Completed|Cancelled
        // Calls procedure: SP_GET_BOOKINGS_BY_STATUS_CURSOR
        [HttpGet("by-status-sp")]
        public async Task<IActionResult> GetBookingsByStatusSp([FromQuery] string status)
        {
            if (string.IsNullOrEmpty(status))
            {
                return BadRequest(new { message = "Status is required." });
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
                    command.CommandText = "BEGIN GET_BOOKINGS_STATUS_CURSOR(:p_status, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_status", OracleDbType.Varchar2, status, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var rawBookings = new List<object>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            rawBookings.Add(new
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                UserEmail = reader["USEREMAIL"].ToString() ?? "",
                                BusName = reader["BUSNAME"].ToString() ?? "",
                                FromDistrict = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate = reader["JOURNEYDATE"].ToString() ?? "",
                                DepartureTime = reader["DEPARTURETIME"].ToString() ?? "",
                                Seats = reader["SEATS"].ToString() ?? "",
                                PaymentMethod = reader["PAYMENTMETHOD"].ToString() ?? "",
                                TicketIssuingTime = Convert.ToDateTime(reader["TICKETISSUINGTIME"]),
                                Status = reader["COMPUTED_STATUS"].ToString() ?? ""
                            });
                        }
                    }

                    var users = await _context.Users.ToListAsync();
                    var result = rawBookings.Select(b => {
                        var email = (string)GetDynamicProp(b, "UserEmail");
                        var time = (DateTime)GetDynamicProp(b, "TicketIssuingTime");
                        return new
                        {
                            Id = (int)GetDynamicProp(b, "Id"),
                            Username = users.FirstOrDefault(u => u.Email.Equals(email, System.StringComparison.OrdinalIgnoreCase))?.Username ?? email,
                            JourneyDate = (string)GetDynamicProp(b, "JourneyDate"),
                            IssueDate = DateTime.SpecifyKind(time, DateTimeKind.Utc),
                            BusName = (string)GetDynamicProp(b, "BusName"),
                            FromDistrict = (string)GetDynamicProp(b, "FromDistrict"),
                            ToDistrict = (string)GetDynamicProp(b, "ToDistrict"),
                            Seats = (string)GetDynamicProp(b, "Seats"),
                            PaymentMethod = (string)GetDynamicProp(b, "PaymentMethod"),
                            DepartureTime = (string)GetDynamicProp(b, "DepartureTime"),
                            Status = (string)GetDynamicProp(b, "Status")
                        };
                    }).ToList();

                    return Ok(result);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        private static object GetDynamicProp(object obj, string name)
        {
            var p = obj.GetType().GetProperty(name);
            return p != null ? p.GetValue(obj) : null;
        }

        // POST: api/booking/cancel/{id}
        // Calls procedure: CANCEL_BOOKING
        [HttpPost("cancel/{id}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN CANCEL_BOOKING(:p_booking_id, :p_result); END;",
                new OracleParameter("p_booking_id", id),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // POST: api/booking/cancel-sp/{id}
        // Calls procedure: SP_CANCEL_BOOKING
        [HttpPost("cancel-sp/{id}")]
        public async Task<IActionResult> CancelBookingSp(int id)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN SP_CANCEL_BOOKING(:p_booking_id, :p_result); END;",
                new OracleParameter("p_booking_id", id),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // GET: api/booking/check-upcoming?journeyDate=15/06/26&departureTime=07:30 AM
        // Calls function: FN_IS_JOURNEY_UPCOMING
        [HttpGet("check-upcoming")]
        public async Task<IActionResult> CheckUpcoming([FromQuery] string journeyDate, [FromQuery] string departureTime)
        {
            if (string.IsNullOrEmpty(journeyDate) || string.IsNullOrEmpty(departureTime))
            {
                return BadRequest(new { message = "journeyDate and departureTime are required." });
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
                    command.CommandText = "SELECT FN_IS_JOURNEY_UPCOMING(:p_journey_date, :p_departure_time) FROM DUAL";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_journey_date", OracleDbType.Varchar2, journeyDate, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_departure_time", OracleDbType.Varchar2, departureTime, ParameterDirection.Input));

                    var raw = await command.ExecuteScalarAsync();
                    string isUpcoming = raw?.ToString() ?? "UNKNOWN";

                    return Ok(new { journeyDate, departureTime, isUpcoming });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/booking/summary
        // Calls procedure: SP_GET_SUMMARY_REPORT (which internally calls FN_GET_TOTAL_REVENUE)
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummaryReport()
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
                    command.CommandText =
                        "BEGIN SP_GET_SUMMARY_REPORT(:p_total_users, :p_total_admins, :p_total_buses, " +
                        ":p_total_bookings, :p_upcoming, :p_completed, :p_cancelled, :p_total_revenue); END;";
                    command.CommandType = CommandType.Text;

                    var pUsers     = new OracleParameter("p_total_users",    OracleDbType.Decimal, ParameterDirection.Output);
                    var pAdmins    = new OracleParameter("p_total_admins",   OracleDbType.Decimal, ParameterDirection.Output);
                    var pBuses     = new OracleParameter("p_total_buses",    OracleDbType.Decimal, ParameterDirection.Output);
                    var pBookings  = new OracleParameter("p_total_bookings", OracleDbType.Decimal, ParameterDirection.Output);
                    var pUpcoming  = new OracleParameter("p_upcoming",       OracleDbType.Decimal, ParameterDirection.Output);
                    var pCompleted = new OracleParameter("p_completed",      OracleDbType.Decimal, ParameterDirection.Output);
                    var pCancelled = new OracleParameter("p_cancelled",      OracleDbType.Decimal, ParameterDirection.Output);
                    var pRevenue   = new OracleParameter("p_total_revenue",  OracleDbType.Decimal, ParameterDirection.Output);

                    command.Parameters.AddRange(new[] { pUsers, pAdmins, pBuses, pBookings, pUpcoming, pCompleted, pCancelled, pRevenue });

                    await command.ExecuteNonQueryAsync();

                    return Ok(new
                    {
                        totalUsers    = Convert.ToInt32(pUsers.Value?.ToString()     ?? "0"),
                        totalAdmins   = Convert.ToInt32(pAdmins.Value?.ToString()    ?? "0"),
                        totalBuses    = Convert.ToInt32(pBuses.Value?.ToString()     ?? "0"),
                        totalBookings = Convert.ToInt32(pBookings.Value?.ToString()  ?? "0"),
                        upcoming      = Convert.ToInt32(pUpcoming.Value?.ToString()  ?? "0"),
                        completed     = Convert.ToInt32(pCompleted.Value?.ToString() ?? "0"),
                        cancelled     = Convert.ToInt32(pCancelled.Value?.ToString() ?? "0"),
                        totalRevenue  = Convert.ToDecimal(pRevenue.Value?.ToString() ?? "0")
                    });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }
    }
}
