using System;
using System.ComponentModel.DataAnnotations;

namespace BusTicketingBackend.Models
{
    public class Booking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        public int BusId { get; set; }

        [Required]
        [StringLength(100)]
        public string BusName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FromDistrict { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ToDistrict { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string JourneyDate { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Seats { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = string.Empty;

        public DateTime TicketIssuingTime { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(50)]
        public string DepartureTime { get; set; } = string.Empty;
    }
}
