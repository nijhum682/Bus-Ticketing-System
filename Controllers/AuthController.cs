using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] User user)
        {
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                return BadRequest(new { message = "Email already registered." });
            }

            if (await _context.Users.AnyAsync(u => u.Username == user.Username))
            {
                return BadRequest(new { message = "Username already taken." });
            }

            // In a real application, you should hash the password!
            // For this project, we store it as is as per simplified requirement if not specified.
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful!" });
        }

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

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var user = (await _context.Users.Where(u => u.Email == email || u.Username == email).ToListAsync()).FirstOrDefault();

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new {
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
                user.PermDivision
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new { 
                    u.Name, 
                    u.Username, 
                    u.Email, 
                    u.Phone, 
                    u.Role, 
                    u.CreatedAt,
                    u.Gender,
                    u.PermanentDistrict,
                    u.Profession,
                    u.PresArea,
                    u.PresUpazilla,
                    u.PresDistrict,
                    u.PresDivision,
                    u.PermArea,
                    u.PermUpazilla,
                    u.PermDivision
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpPost("users/update")]
        public async Task<IActionResult> AdminUpdateUser([FromBody] AdminUpdateUserModel model)
        {
            var user = (await _context.Users.Where(u => u.Username == model.Username).ToListAsync()).FirstOrDefault();
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!string.Equals(user.Email, model.Email, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Users.AnyAsync(u => u.Email == model.Email))
                {
                    return BadRequest(new { message = "Email address is already registered." });
                }
                user.Email = model.Email;
            }

            user.Name = model.Name;
            user.Phone = model.Phone ?? string.Empty;
            user.Gender = model.Gender ?? string.Empty;
            user.PermanentDistrict = model.PermanentDistrict ?? string.Empty;
            user.Profession = model.Profession ?? string.Empty;
            user.PresArea = model.PresArea ?? string.Empty;
            user.PresUpazilla = model.PresUpazilla ?? string.Empty;
            user.PresDistrict = model.PresDistrict ?? string.Empty;
            user.PresDivision = model.PresDivision ?? string.Empty;
            user.PermArea = model.PermArea ?? string.Empty;
            user.PermUpazilla = model.PermUpazilla ?? string.Empty;
            user.PermDivision = model.PermDivision ?? string.Empty;
            user.Role = model.Role ?? "User";

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User updated successfully!" });
        }

        [HttpDelete("users/{username}")]
        public async Task<IActionResult> DeleteUser(string username)
        {
            var user = (await _context.Users.Where(u => u.Username == username).ToListAsync()).FirstOrDefault();
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully!" });
        }

        [HttpPost("profile/update")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            if (string.IsNullOrEmpty(model.CurrentEmail))
            {
                return BadRequest(new { message = "Current email is required." });
            }

            var user = (await _context.Users.Where(u => u.Email == model.CurrentEmail).ToListAsync()).FirstOrDefault();
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!string.Equals(user.Email, model.Email, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Users.AnyAsync(u => u.Email == model.Email))
                {
                    return BadRequest(new { message = "Email address is already registered." });
                }
                user.Email = model.Email;
            }

            user.Name = model.Name;
            user.Phone = model.Phone ?? string.Empty;
            user.PermanentDistrict = model.PermanentDistrict ?? string.Empty;
            user.Gender = model.Gender ?? string.Empty;
            user.Profession = model.Profession ?? string.Empty;
            user.PresArea = model.PresArea ?? string.Empty;
            user.PresUpazilla = model.PresUpazilla ?? string.Empty;
            user.PresDistrict = model.PresDistrict ?? string.Empty;
            user.PresDivision = model.PresDivision ?? string.Empty;
            user.PermArea = model.PermArea ?? string.Empty;
            user.PermUpazilla = model.PermUpazilla ?? string.Empty;
            user.PermDivision = model.PermDivision ?? string.Empty;

            if (!string.IsNullOrEmpty(model.NewPassword))
            {
                user.Password = model.NewPassword;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully!", email = user.Email });
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
