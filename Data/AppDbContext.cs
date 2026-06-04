using BusTicketingBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace BusTicketingBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Notice> Notices { get; set; }
    }
}
