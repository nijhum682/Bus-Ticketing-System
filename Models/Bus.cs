using System.ComponentModel.DataAnnotations;

namespace BusTicketingBackend.Models
{
    public class Bus
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Operator { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string BusType { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string DepartureTime { get; set; } = string.Empty;

        [Required]
        public int Fare { get; set; }

        [Required]
        public int AvailableSeats { get; set; }

        [Required]
        [StringLength(100)]
        public string FromDistrict { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ToDistrict { get; set; } = string.Empty;
    }
}
