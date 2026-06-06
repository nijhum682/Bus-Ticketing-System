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
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.Email == model.Email || u.Username == model.Email) && u.Password == model.Password);

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

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email || u.Username == email);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new {
                user.Name,
                user.Email,
                user.Phone,
                user.PermanentDistrict,
                user.Gender,
                user.Profession,
                user.CreatedAt,
                user.Role
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Name, u.Username, u.Email, u.Phone, u.Role, u.CreatedAt })
                .ToListAsync();
            return Ok(users);
        }
    }

    public class SignInModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
