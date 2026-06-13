using System.ComponentModel.DataAnnotations;

namespace BusTicketingBackend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PermanentDistrict { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PresArea { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PresUpazilla { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PresDistrict { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PresDivision { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PermArea { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PermUpazilla { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? PermDivision { get; set; } = string.Empty;
 
        [StringLength(20)]
        public string? Gender { get; set; } = string.Empty;
 
        [StringLength(100)]
        public string? Profession { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Role { get; set; } = "User";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
