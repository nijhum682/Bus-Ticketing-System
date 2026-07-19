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
    public class BusController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BusController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/bus/search
        // Calls procedure: SP_SEARCH_BUSES
        [HttpGet("search")]
        public async Task<IActionResult> SearchBuses([FromQuery] string from, [FromQuery] string to, [FromQuery] string date)
        {
            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(to))
            {
                return BadRequest(new { message = "From and To locations are required." });
            }

            from = StandardizeLocation(from);
            to = StandardizeLocation(to);

            if (!string.IsNullOrEmpty(date))
            {
                await EnsureDateBusesCloned(date);
            }

            var buses = await _context.Buses.FromSqlRaw(
                "BEGIN SP_SEARCH_BUSES(:p_from_district, :p_to_district, :p_journey_date, :p_cursor); END;",
                new OracleParameter("p_from_district", from),
                new OracleParameter("p_to_district", to),
                new OracleParameter("p_journey_date", date ?? ""),
                new OracleParameter("p_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output }
            ).ToListAsync();

            return Ok(buses);
        }

        // GET: api/bus/seats/{id}
        // Calls function: FN_GET_AVAILABLE_SEATS
        [HttpGet("seats/{id}")]
        public async Task<IActionResult> GetAvailableSeats(int id)
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
                    command.CommandText = "SELECT FN_GET_AVAILABLE_SEATS(:p_bus_id) FROM DUAL";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_bus_id", OracleDbType.Decimal, id, ParameterDirection.Input));

                    var raw = await command.ExecuteScalarAsync();
                    int availableSeats = raw != null && raw != DBNull.Value ? Convert.ToInt32(raw) : -1;

                    if (availableSeats == -1)
                        return NotFound(new { message = $"Bus ID {id} not found." });

                    return Ok(new { busId = id, availableSeats });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/bus
        // Calls procedure: SP_GET_ALL_BUSES_CURSOR when date is specified
        [HttpGet]
        public async Task<IActionResult> GetBuses([FromQuery] string? date)
        {
            if (string.IsNullOrEmpty(date))
            {
                // Fallback to GET_TEMPLATE_BUSES instead of LINQ EF
                return await GetTemplateBuses();
            }

            await EnsureDateBusesCloned(date);

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
                    command.CommandText = "BEGIN SP_GET_ALL_BUSES_CURSOR(:p_journey_date, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_journey_date", OracleDbType.Varchar2, date, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var buses = new List<Bus>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            buses.Add(new Bus
                            {
                                Id             = Convert.ToInt32(reader["ID"]),
                                Operator       = reader["OPERATOR"].ToString() ?? "",
                                BusType        = reader["BUSTYPE"].ToString() ?? "",
                                DepartureTime  = reader["DEPARTURETIME"].ToString() ?? "",
                                Fare           = reader["FARE"] != DBNull.Value ? Convert.ToInt32(reader["FARE"]) : 0,
                                AvailableSeats = reader["AVAILABLESEATS"] != DBNull.Value ? Convert.ToInt32(reader["AVAILABLESEATS"]) : 0,
                                FromDistrict   = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict     = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate    = reader["JOURNEYDATE"].ToString() ?? "",
                                BookedSeats    = reader["BOOKEDSEATS"].ToString() ?? ""
                            });
                        }
                    }
                    return Ok(buses);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/bus/{id}
        // Calls procedure: GET_BUS_BY_ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBusById(int id)
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
                    command.CommandText = "BEGIN GET_BUS_BY_ID(:p_id, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_id", OracleDbType.Decimal, id, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var bus = new Bus
                            {
                                Id             = Convert.ToInt32(reader["ID"]),
                                Operator       = reader["OPERATOR"].ToString() ?? "",
                                BusType        = reader["BUSTYPE"].ToString() ?? "",
                                DepartureTime  = reader["DEPARTURETIME"].ToString() ?? "",
                                Fare           = reader["FARE"] != DBNull.Value ? Convert.ToInt32(reader["FARE"]) : 0,
                                AvailableSeats = reader["AVAILABLESEATS"] != DBNull.Value ? Convert.ToInt32(reader["AVAILABLESEATS"]) : 0,
                                FromDistrict   = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict     = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate    = reader["JOURNEYDATE"].ToString() ?? "",
                                BookedSeats    = reader["BOOKEDSEATS"].ToString() ?? ""
                            };
                            return Ok(bus);
                        }
                    }
                    return NotFound(new { message = "Bus not found." });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/bus/by-date
        // Calls procedure: GET_BUSES_BY_DATE
        [HttpGet("by-date")]
        public async Task<IActionResult> GetBusesByDate([FromQuery] string date)
        {
            if (string.IsNullOrEmpty(date))
            {
                return BadRequest(new { message = "Date is required." });
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
                    command.CommandText = "BEGIN GET_BUSES_BY_DATE(:p_journey_date, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_journey_date", OracleDbType.Varchar2, date, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var buses = new List<Bus>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            buses.Add(new Bus
                            {
                                Id             = Convert.ToInt32(reader["ID"]),
                                Operator       = reader["OPERATOR"].ToString() ?? "",
                                BusType        = reader["BUSTYPE"].ToString() ?? "",
                                DepartureTime  = reader["DEPARTURETIME"].ToString() ?? "",
                                Fare           = reader["FARE"] != DBNull.Value ? Convert.ToInt32(reader["FARE"]) : 0,
                                AvailableSeats = reader["AVAILABLESEATS"] != DBNull.Value ? Convert.ToInt32(reader["AVAILABLESEATS"]) : 0,
                                FromDistrict   = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict     = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate    = reader["JOURNEYDATE"].ToString() ?? "",
                                BookedSeats    = reader["BOOKEDSEATS"].ToString() ?? ""
                            });
                        }
                    }
                    return Ok(buses);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/bus/by-route
        // Calls procedure: GET_BUSES_BY_ROUTE
        [HttpGet("by-route")]
        public async Task<IActionResult> GetBusesByRoute([FromQuery] string from, [FromQuery] string to, [FromQuery] string date)
        {
            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(to) || string.IsNullOrEmpty(date))
            {
                return BadRequest(new { message = "From, To, and Date are required." });
            }

            from = StandardizeLocation(from);
            to = StandardizeLocation(to);

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
                    command.CommandText = "BEGIN GET_BUSES_BY_ROUTE(:p_from_district, :p_to_district, :p_journey_date, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_from_district", OracleDbType.Varchar2, from, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_to_district", OracleDbType.Varchar2, to, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_journey_date", OracleDbType.Varchar2, date, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var buses = new List<Bus>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            buses.Add(new Bus
                            {
                                Id             = Convert.ToInt32(reader["ID"]),
                                Operator       = reader["OPERATOR"].ToString() ?? "",
                                BusType        = reader["BUSTYPE"].ToString() ?? "",
                                DepartureTime  = reader["DEPARTURETIME"].ToString() ?? "",
                                Fare           = reader["FARE"] != DBNull.Value ? Convert.ToInt32(reader["FARE"]) : 0,
                                AvailableSeats = reader["AVAILABLESEATS"] != DBNull.Value ? Convert.ToInt32(reader["AVAILABLESEATS"]) : 0,
                                FromDistrict   = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict     = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate    = reader["JOURNEYDATE"].ToString() ?? "",
                                BookedSeats    = reader["BOOKEDSEATS"].ToString() ?? ""
                            });
                        }
                    }
                    return Ok(buses);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/bus/templates
        // Calls procedure: GET_TEMPLATE_BUSES
        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplateBuses()
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
                    command.CommandText = "BEGIN GET_TEMPLATE_BUSES(:p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var buses = new List<Bus>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            buses.Add(new Bus
                            {
                                Id             = Convert.ToInt32(reader["ID"]),
                                Operator       = reader["OPERATOR"].ToString() ?? "",
                                BusType        = reader["BUSTYPE"].ToString() ?? "",
                                DepartureTime  = reader["DEPARTURETIME"].ToString() ?? "",
                                Fare           = reader["FARE"] != DBNull.Value ? Convert.ToInt32(reader["FARE"]) : 0,
                                AvailableSeats = reader["AVAILABLESEATS"] != DBNull.Value ? Convert.ToInt32(reader["AVAILABLESEATS"]) : 0,
                                FromDistrict   = reader["FROMDISTRICT"].ToString() ?? "",
                                ToDistrict     = reader["TODISTRICT"].ToString() ?? "",
                                JourneyDate    = reader["JOURNEYDATE"].ToString() ?? "",
                                BookedSeats    = reader["BOOKEDSEATS"].ToString() ?? ""
                            });
                        }
                    }
                    return Ok(buses);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // POST: api/bus
        // Calls procedure: ADD_BUS
        [HttpPost]
        public async Task<IActionResult> PostBus([FromBody] Bus bus)
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

            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN ADD_BUS(:p_operator, :p_bus_type, :p_depart_time, :p_fare, :p_avail_seats, :p_from_district, :p_to_district, :p_journey_date, :p_result); END;",
                new OracleParameter("p_operator", bus.Operator),
                new OracleParameter("p_bus_type", bus.BusType),
                new OracleParameter("p_depart_time", bus.DepartureTime),
                new OracleParameter("p_fare", OracleDbType.Decimal, bus.Fare, ParameterDirection.Input),
                new OracleParameter("p_avail_seats", OracleDbType.Decimal, bus.AvailableSeats, ParameterDirection.Input),
                new OracleParameter("p_from_district", bus.FromDistrict),
                new OracleParameter("p_to_district", bus.ToDistrict),
                new OracleParameter("p_journey_date", bus.JourneyDate ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // PUT: api/bus/5
        // Calls procedure: UPDATE_BUS
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

            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN UPDATE_BUS(:p_id, :p_operator, :p_bus_type, :p_depart_time, :p_fare, :p_from_district, :p_to_district, :p_result); END;",
                new OracleParameter("p_id", OracleDbType.Decimal, bus.Id, ParameterDirection.Input),
                new OracleParameter("p_operator", bus.Operator),
                new OracleParameter("p_bus_type", bus.BusType),
                new OracleParameter("p_depart_time", bus.DepartureTime),
                new OracleParameter("p_fare", OracleDbType.Decimal, bus.Fare, ParameterDirection.Input),
                new OracleParameter("p_from_district", bus.FromDistrict),
                new OracleParameter("p_to_district", bus.ToDistrict),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim(), bus });
        }

        // POST: api/bus/seats/update
        // Calls procedure: UPDATE_BUS_SEATS
        [HttpPost("seats/update")]
        public async Task<IActionResult> UpdateSeats([FromBody] UpdateSeatsModel model)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN UPDATE_BUS_SEATS(:p_bus_id, :p_avail_seats, :p_booked_seats, :p_result); END;",
                new OracleParameter("p_bus_id", OracleDbType.Decimal, model.BusId, ParameterDirection.Input),
                new OracleParameter("p_avail_seats", OracleDbType.Decimal, model.AvailableSeats, ParameterDirection.Input),
                new OracleParameter("p_booked_seats", model.BookedSeats ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // DELETE: api/bus/{id}
        // Calls procedure: DELETE_BUS
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBus(int id)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN DELETE_BUS(:p_bus_id, :p_result); END;",
                new OracleParameter("p_bus_id", OracleDbType.Decimal, id, ParameterDirection.Input),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return result.Contains("not found")
                    ? NotFound(new { message = result.Replace("ERROR:", "").Trim() })
                    : BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // DELETE: api/bus/sp/{id}
        // Calls procedure: SP_DELETE_BUS
        [HttpDelete("sp/{id}")]
        public async Task<IActionResult> DeleteBusSp(int id)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN SP_DELETE_BUS(:p_bus_id, :p_result); END;",
                new OracleParameter("p_bus_id", OracleDbType.Decimal, id, ParameterDirection.Input),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return result.Contains("not found")
                    ? NotFound(new { message = result.Replace("ERROR:", "").Trim() })
                    : BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        private async Task EnsureDateBusesCloned(string date)
        {
            if (string.IsNullOrEmpty(date)) return;

            var count = await _context.Buses.CountAsync(b => b.JourneyDate == date);
            var templateCount = await _context.Buses.CountAsync(b => b.JourneyDate == "");

            if (count < templateCount)
            {
                if (count == 0)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "INSERT INTO \"BUSES\" (\"OPERATOR\", \"BUSTYPE\", \"DEPARTURETIME\", \"FARE\", \"AVAILABLESEATS\", \"FROMDISTRICT\", \"TODISTRICT\", \"JOURNEYDATE\", \"BOOKEDSEATS\") " +
                        "SELECT \"OPERATOR\", \"BUSTYPE\", \"DEPARTURETIME\", \"FARE\", \"AVAILABLESEATS\", \"FROMDISTRICT\", \"TODISTRICT\", {0}, '' " +
                        "FROM \"BUSES\" WHERE \"JOURNEYDATE\" IS NULL OR \"JOURNEYDATE\" = ''",
                        date
                    );
                }
                else
                {
                    var existingBuses = await _context.Buses
                        .Where(b => b.JourneyDate == date)
                        .Select(b => new { b.Operator, b.BusType, b.FromDistrict, b.ToDistrict, b.DepartureTime })
                        .ToListAsync();

                    var existingKeys = new HashSet<string>(
                        existingBuses.Select(b => $"{b.Operator}_{b.BusType}_{b.FromDistrict}_{b.ToDistrict}_{b.DepartureTime}")
                    );

                    var templates = await _context.Buses.Where(b => b.JourneyDate == "" || b.JourneyDate == null).ToListAsync();
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

        private string StandardizeLocation(string val)
        {
            if (string.IsNullOrWhiteSpace(val)) return string.Empty;
            val = val.Trim();
            if (val.Length == 1) return val.ToUpperInvariant();
            return char.ToUpperInvariant(val[0]) + val.Substring(1).ToLowerInvariant();
        }
    }

    public class UpdateSeatsModel
    {
        public int BusId { get; set; }
        public int AvailableSeats { get; set; }
        public string BookedSeats { get; set; } = string.Empty;
    }
}
