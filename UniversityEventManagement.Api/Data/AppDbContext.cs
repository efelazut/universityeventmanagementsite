using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Club> Clubs => Set<Club>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Registration> Registrations => Set<Registration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(user => user.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.HasIndex(user => user.Email)
                .IsUnique();
        });

        modelBuilder.Entity<Club>(entity =>
        {
            entity.Property(club => club.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(club => club.Description)
                .HasMaxLength(1000);

            entity.HasMany(club => club.Events)
                .WithOne(@event => @event.Club)
                .HasForeignKey(@event => @event.ClubId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.Property(room => room.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(room => room.Location)
                .HasMaxLength(255)
                .IsRequired();

            entity.HasMany(room => room.Events)
                .WithOne(@event => @event.Room)
                .HasForeignKey(@event => @event.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.Property(@event => @event.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(@event => @event.Description)
                .HasMaxLength(2000);
        });

        modelBuilder.Entity<Registration>(entity =>
        {
            entity.HasIndex(registration => new { registration.UserId, registration.EventId })
                .IsUnique();

            entity.HasOne(registration => registration.User)
                .WithMany(user => user.Registrations)
                .HasForeignKey(registration => registration.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(registration => registration.Event)
                .WithMany(@event => @event.Registrations)
                .HasForeignKey(registration => registration.EventId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
