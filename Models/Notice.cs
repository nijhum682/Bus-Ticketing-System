using System.ComponentModel.DataAnnotations;

namespace BusTicketingBackend.Models
{
    public class Notice
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(10)]
        public string NoticeNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
