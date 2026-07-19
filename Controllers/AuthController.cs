using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace BusTicketingBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/signup
        // Calls procedure: REGISTER_USER
        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] User user)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN REGISTER_USER(:p_name, :p_username, :p_email, :p_password, :p_phone, :p_role, :p_gender, :p_profession, :p_pres_area, :p_pres_upazilla, :p_pres_district, :p_pres_division, :p_perm_area, :p_perm_upazilla, :p_perm_district, :p_perm_division, :p_result); END;",
                new OracleParameter("p_name", user.Name),
                new OracleParameter("p_username", user.Username),
                new OracleParameter("p_email", user.Email),
                new OracleParameter("p_password", user.Password),
                new OracleParameter("p_phone", user.Phone ?? ""),
                new OracleParameter("p_role", user.Role ?? "User"),
                new OracleParameter("p_gender", user.Gender ?? ""),
                new OracleParameter("p_profession", user.Profession ?? ""),
                new OracleParameter("p_pres_area", user.PresArea ?? ""),
                new OracleParameter("p_pres_upazilla", user.PresUpazilla ?? ""),
                new OracleParameter("p_pres_district", user.PresDistrict ?? ""),
                new OracleParameter("p_pres_division", user.PresDivision ?? ""),
                new OracleParameter("p_perm_area", user.PermArea ?? ""),
                new OracleParameter("p_perm_upazilla", user.PermUpazilla ?? ""),
                new OracleParameter("p_perm_district", user.PermanentDistrict ?? ""),
                new OracleParameter("p_perm_division", user.PermDivision ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // POST: api/auth/signup-sp
        // Calls procedure: SP_REGISTER_USER
        [HttpPost("signup-sp")]
        public async Task<IActionResult> SignUpSp([FromBody] User user)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN SP_REGISTER_USER(:p_name, :p_username, :p_email, :p_password, :p_phone, :p_role, :p_gender, :p_profession, :p_pres_area, :p_pres_upazilla, :p_pres_district, :p_pres_division, :p_perm_area, :p_perm_upazilla, :p_perm_district, :p_perm_division, :p_result); END;",
                new OracleParameter("p_name", user.Name),
                new OracleParameter("p_username", user.Username),
                new OracleParameter("p_email", user.Email),
                new OracleParameter("p_password", user.Password),
                new OracleParameter("p_phone", user.Phone ?? ""),
                new OracleParameter("p_role", user.Role ?? "User"),
                new OracleParameter("p_gender", user.Gender ?? ""),
                new OracleParameter("p_profession", user.Profession ?? ""),
                new OracleParameter("p_pres_area", user.PresArea ?? ""),
                new OracleParameter("p_pres_upazilla", user.PresUpazilla ?? ""),
                new OracleParameter("p_pres_district", user.PresDistrict ?? ""),
                new OracleParameter("p_pres_division", user.PresDivision ?? ""),
                new OracleParameter("p_perm_area", user.PermArea ?? ""),
                new OracleParameter("p_perm_upazilla", user.PermUpazilla ?? ""),
                new OracleParameter("p_perm_district", user.PermanentDistrict ?? ""),
                new OracleParameter("p_perm_division", user.PermDivision ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // POST: api/auth/signin
        [HttpPost("signin")]
        public async Task<IActionResult> SignIn([FromBody] SignInModel model)
        {
            var user = (await _context.Users.Where(u =>
                (u.Email == model.Email || u.Username == model.Email) && u.Password == model.Password).ToListAsync()).FirstOrDefault();

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(new { message = $"Welcome back, {user.Name}!", user = new { user.Name, user.Email, user.Role } });
        }

        // GET: api/auth/profile?email=...
        // Calls procedure: GET_USER_BY_EMAIL
        // Calls function: FN_COUNT_USER_BOOKINGS to include booking count in profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "Email is required." });
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

                User user = null;
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "BEGIN GET_USER_BY_EMAIL(:p_email, :p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_email", OracleDbType.Varchar2, email, ParameterDirection.Input));
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            user = new User
                            {
                                Id = Convert.ToInt32(reader["ID"]),
                                Name = reader["NAME"].ToString() ?? "",
                                Username = reader["USERNAME"].ToString() ?? "",
                                Email = reader["EMAIL"].ToString() ?? "",
                                Password = reader["PASSWORD"].ToString() ?? "",
                                Phone = reader["PHONE"] != DBNull.Value ? reader["PHONE"].ToString() : null,
                                Role = reader["ROLE"] != DBNull.Value ? reader["ROLE"].ToString() : "User",
                                CreatedAt = Convert.ToDateTime(reader["CREATEDAT"]),
                                Gender = reader["GENDER"] != DBNull.Value ? reader["GENDER"].ToString() ?? "" : "",
                                Profession = reader["PROFESSION"] != DBNull.Value ? reader["PROFESSION"].ToString() ?? "" : "",
                                PresArea = reader["PRESAREA"] != DBNull.Value ? reader["PRESAREA"].ToString() ?? "" : "",
                                PresUpazilla = reader["PRESUPAZILLA"] != DBNull.Value ? reader["PRESUPAZILLA"].ToString() ?? "" : "",
                                PresDistrict = reader["PRESDISTRICT"] != DBNull.Value ? reader["PRESDISTRICT"].ToString() ?? "" : "",
                                PresDivision = reader["PRESDIVISION"] != DBNull.Value ? reader["PRESDIVISION"].ToString() ?? "" : "",
                                PermArea = reader["PERMAREA"] != DBNull.Value ? reader["PERMAREA"].ToString() ?? "" : "",
                                PermUpazilla = reader["PERMUPAZILLA"] != DBNull.Value ? reader["PERMUPAZILLA"].ToString() ?? "" : "",
                                PermanentDistrict = reader["PERMANENTDISTRICT"] != DBNull.Value ? reader["PERMANENTDISTRICT"].ToString() ?? "" : "",
                                PermDivision = reader["PERMDIVISION"] != DBNull.Value ? reader["PERMDIVISION"].ToString() ?? "" : ""
                            };
                        }
                    }
                }

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // Call FN_COUNT_USER_BOOKINGS to get the user's total booking count from Oracle function
                decimal totalBookings = 0;
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT FN_COUNT_USER_BOOKINGS(:p_email) FROM DUAL";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_email", OracleDbType.Varchar2, email, ParameterDirection.Input));

                    var raw = await command.ExecuteScalarAsync();
                    if (raw != null && raw != DBNull.Value)
                        totalBookings = Convert.ToDecimal(raw);
                }

                return Ok(new
                {
                    user.Name,
                    user.Username,
                    user.Email,
                    user.Phone,
                    user.PermanentDistrict,
                    user.Gender,
                    user.Profession,
                    user.CreatedAt,
                    user.Role,
                    user.PresArea,
                    user.PresUpazilla,
                    user.PresDistrict,
                    user.PresDivision,
                    user.PermArea,
                    user.PermUpazilla,
                    user.PermDivision,
                    TotalBookings = (int)totalBookings
                });
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/auth/users/id/{id}
        // Calls procedure: GET_USER_BY_ID
        [HttpGet("users/id/{id}")]
        public async Task<IActionResult> GetUserById(int id)
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
                    command.CommandText = "BEGIN GET_USER_BY_ID(:p_id, :p_cursor); END;";
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
                                Name = reader["NAME"].ToString() ?? "",
                                Username = reader["USERNAME"].ToString() ?? "",
                                Email = reader["EMAIL"].ToString() ?? "",
                                Phone = reader["PHONE"] != DBNull.Value ? reader["PHONE"].ToString() : "",
                                Role = reader["ROLE"].ToString() ?? "",
                                CreatedAt = Convert.ToDateTime(reader["CREATEDAT"])
                            });
                        }
                    }
                    return NotFound(new { message = "User not found." });
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // GET: api/auth/users
        // Calls procedure: GET_ALL_USERS
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
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
                    command.CommandText = "BEGIN GET_ALL_USERS(:p_cursor); END;";
                    command.CommandType = CommandType.Text;
                    command.Parameters.Add(new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output));

                    var users = new List<object>();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            users.Add(new
                            {
                                Name = reader["NAME"].ToString() ?? "",
                                Username = reader["USERNAME"].ToString() ?? "",
                                Email = reader["EMAIL"].ToString() ?? "",
                                Phone = reader["PHONE"] != DBNull.Value ? reader["PHONE"].ToString() : "",
                                Role = reader["ROLE"].ToString() ?? "",
                                CreatedAt = Convert.ToDateTime(reader["CREATEDAT"]),
                                Gender = reader["GENDER"] != DBNull.Value ? reader["GENDER"].ToString() : "",
                                PermanentDistrict = reader["PERMANENTDISTRICT"] != DBNull.Value ? reader["PERMANENTDISTRICT"].ToString() : "",
                                Profession = reader["PROFESSION"] != DBNull.Value ? reader["PROFESSION"].ToString() : "",
                                PresArea = reader["PRESAREA"] != DBNull.Value ? reader["PRESAREA"].ToString() : "",
                                PresUpazilla = reader["PRESUPAZILLA"] != DBNull.Value ? reader["PRESUPAZILLA"].ToString() : "",
                                PresDistrict = reader["PRESDISTRICT"] != DBNull.Value ? reader["PRESDISTRICT"].ToString() : "",
                                PresDivision = reader["PRESDIVISION"] != DBNull.Value ? reader["PRESDIVISION"].ToString() : "",
                                PermArea = reader["PERMAREA"] != DBNull.Value ? reader["PERMAREA"].ToString() : "",
                                PermUpazilla = reader["PERMUPAZILLA"] != DBNull.Value ? reader["PERMUPAZILLA"].ToString() : "",
                                PermDivision = reader["PERMDIVISION"] != DBNull.Value ? reader["PERMDIVISION"].ToString() : ""
                            });
                        }
                    }
                    return Ok(users);
                }
            }
            finally
            {
                if (opened && connection.State == ConnectionState.Open)
                    connection.Close();
            }
        }

        // POST: api/auth/users/update
        // Calls procedure: UPDATE_USER
        [HttpPost("users/update")]
        public async Task<IActionResult> AdminUpdateUser([FromBody] AdminUpdateUserModel model)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN UPDATE_USER(:p_username, :p_name, :p_email, :p_phone, :p_role, :p_result); END;",
                new OracleParameter("p_username", model.Username),
                new OracleParameter("p_name", model.Name),
                new OracleParameter("p_email", model.Email),
                new OracleParameter("p_phone", model.Phone ?? ""),
                new OracleParameter("p_role", model.Role ?? "User"),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim() });
        }

        // DELETE: api/auth/users/{username}
        // Calls procedure: DELETE_USER
        [HttpDelete("users/{username}")]
        public async Task<IActionResult> DeleteUser(string username)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN DELETE_USER(:p_username, :p_result); END;",
                new OracleParameter("p_username", OracleDbType.Varchar2, username, ParameterDirection.Input),
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

        // DELETE: api/auth/users-sp/{username}
        // Calls procedure: SP_DELETE_USER
        [HttpDelete("users-sp/{username}")]
        public async Task<IActionResult> DeleteUserSp(string username)
        {
            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN SP_DELETE_USER(:p_username, :p_result); END;",
                new OracleParameter("p_username", OracleDbType.Varchar2, username, ParameterDirection.Input),
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

        // POST: api/auth/profile/update
        // Calls procedure: UPDATE_USER_PROFILE
        [HttpPost("profile/update")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            if (string.IsNullOrEmpty(model.CurrentEmail))
            {
                return BadRequest(new { message = "Current email is required." });
            }

            var resultParam = new OracleParameter("p_result", OracleDbType.Varchar2, 2000)
            {
                Direction = ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN UPDATE_USER_PROFILE(:p_email, :p_name, :p_phone, :p_new_password, :p_gender, :p_profession, :p_pres_area, :p_pres_upazilla, :p_pres_district, :p_pres_division, :p_perm_area, :p_perm_upazilla, :p_perm_district, :p_perm_division, :p_result); END;",
                new OracleParameter("p_email", model.CurrentEmail),
                new OracleParameter("p_name", model.Name),
                new OracleParameter("p_phone", model.Phone ?? ""),
                new OracleParameter("p_new_password", model.NewPassword ?? ""),
                new OracleParameter("p_gender", model.Gender ?? ""),
                new OracleParameter("p_profession", model.Profession ?? ""),
                new OracleParameter("p_pres_area", model.PresArea ?? ""),
                new OracleParameter("p_pres_upazilla", model.PresUpazilla ?? ""),
                new OracleParameter("p_pres_district", model.PresDistrict ?? ""),
                new OracleParameter("p_pres_division", model.PresDivision ?? ""),
                new OracleParameter("p_perm_area", model.PermArea ?? ""),
                new OracleParameter("p_perm_upazilla", model.PermUpazilla ?? ""),
                new OracleParameter("p_perm_district", model.PermanentDistrict ?? ""),
                new OracleParameter("p_perm_division", model.PermDivision ?? ""),
                resultParam
            );

            string result = resultParam.Value?.ToString() ?? "";
            if (result.StartsWith("ERROR:"))
            {
                return BadRequest(new { message = result.Replace("ERROR:", "").Trim() });
            }

            return Ok(new { message = result.Replace("SUCCESS:", "").Trim(), email = model.Email });
        }
    }

    public class SignInModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateProfileModel
    {
        public string CurrentEmail { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PermanentDistrict { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string Profession { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string PresArea { get; set; } = string.Empty;
        public string PresUpazilla { get; set; } = string.Empty;
        public string PresDistrict { get; set; } = string.Empty;
        public string PresDivision { get; set; } = string.Empty;
        public string PermArea { get; set; } = string.Empty;
        public string PermUpazilla { get; set; } = string.Empty;
        public string PermDivision { get; set; } = string.Empty;
    }

    public class AdminUpdateUserModel
    {
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string PermanentDistrict { get; set; } = string.Empty;
        public string Profession { get; set; } = string.Empty;
        public string PresArea { get; set; } = string.Empty;
        public string PresUpazilla { get; set; } = string.Empty;
        public string PresDistrict { get; set; } = string.Empty;
        public string PresDivision { get; set; } = string.Empty;
        public string PermArea { get; set; } = string.Empty;
        public string PermUpazilla { get; set; } = string.Empty;
        public string PermDivision { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
