using BusTicketingBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace BusTicketingBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Notice> Notices { get; set; }
        public DbSet<Bus> Buses { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Review> Reviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure sequences for Oracle 11g compatibility (instead of Identity columns)
            modelBuilder.HasSequence<int>("USERS_SEQ").StartsAt(1).IncrementsBy(1);
            modelBuilder.Entity<User>().Property(e => e.Id).UseHiLo("USERS_SEQ");

            modelBuilder.HasSequence<int>("NOTICES_SEQ").StartsAt(1).IncrementsBy(1);
            modelBuilder.Entity<Notice>().Property(e => e.Id).UseHiLo("NOTICES_SEQ");

            modelBuilder.HasSequence<int>("BUSES_SEQ").StartsAt(1).IncrementsBy(1);
            modelBuilder.Entity<Bus>().Property(e => e.Id).UseHiLo("BUSES_SEQ");

            modelBuilder.HasSequence<int>("BOOKINGS_SEQ").StartsAt(1).IncrementsBy(1);
            modelBuilder.Entity<Booking>().Property(e => e.Id).UseHiLo("BOOKINGS_SEQ");

            modelBuilder.HasSequence<int>("REVIEWS_SEQ").StartsAt(1).IncrementsBy(1);
            modelBuilder.Entity<Review>().Property(e => e.Id).UseHiLo("REVIEWS_SEQ");

            // Convert all table, column, key, constraint, and index names to UPPERCASE
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (tableName != null)
                {
                    entity.SetTableName(tableName.ToUpperInvariant());
                }

                foreach (var property in entity.GetProperties())
                {
                    var columnName = property.GetColumnName();
                    if (columnName != null)
                    {
                        property.SetColumnName(columnName.ToUpperInvariant());
                    }
                }

                foreach (var key in entity.GetKeys())
                {
                    var keyName = key.GetName();
                    if (keyName != null)
                    {
                        key.SetName(keyName.ToUpperInvariant());
                    }
                }

                foreach (var fk in entity.GetForeignKeys())
                {
                    var fkName = fk.GetConstraintName();
                    if (fkName != null)
                    {
                        fk.SetConstraintName(fkName.ToUpperInvariant());
                    }
                }

                foreach (var index in entity.GetIndexes())
                {
                    var indexName = index.GetDatabaseName();
                    if (indexName != null)
                    {
                        index.SetDatabaseName(indexName.ToUpperInvariant());
                    }
                }
            }
        }
    }
}
