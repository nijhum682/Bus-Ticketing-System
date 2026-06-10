using System;
using System.ComponentModel.DataAnnotations;

namespace BusTicketingBackend.Models
{
    public class Review
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int BookingId { get; set; }

        [StringLength(100)]
        public string UserEmail { get; set; } = string.Empty;

        [StringLength(100)]
        public string BusOperator { get; set; } = string.Empty;

        [StringLength(200)]
        public string Route { get; set; } = string.Empty;

        [StringLength(50)]
        public string JourneyDate { get; set; } = string.Empty;

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [StringLength(1000)]
        public string Comment { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
