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
    public DbSet<EventReview> EventReviews => Set<EventReview>();
    public DbSet<ClubMembership> ClubMemberships => Set<ClubMembership>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MessageThread> MessageThreads => Set<MessageThread>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageThreadReadState> MessageThreadReadStates => Set<MessageThreadReadState>();
    public DbSet<ClubStatistic> ClubStatistics => Set<ClubStatistic>();
    public DbSet<ImportRun> ImportRuns => Set<ImportRun>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.Property(user => user.Role)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.FullName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.Department)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.Faculty)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.StudentNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.YearClass)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(user => user.Bio)
                .HasMaxLength(1000);

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.HasOne(user => user.Club)
                .WithMany(club => club.Members)
                .HasForeignKey(user => user.ClubId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Club>(entity =>
        {
            entity.ToTable("Clubs");

            entity.Property(club => club.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(club => club.Name)
                .IsUnique();

            entity.Property(club => club.Description)
                .HasMaxLength(1000);

            entity.Property(club => club.Category)
                .HasMaxLength(120);

            entity.Property(club => club.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(club => club.BannerUrl)
                .HasMaxLength(500);

            entity.Property(club => club.ShowcaseSummary)
                .HasMaxLength(1200);

            entity.Property(club => club.HighlightTitle)
                .HasMaxLength(200);

            entity.Property(club => club.PresidentName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(club => club.PresidentEmail)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(club => club.InstagramUrl)
                .HasMaxLength(500);

            entity.Property(club => club.AcademicYear)
                .HasMaxLength(40);

            entity.Property(club => club.LogoUrl)
                .HasMaxLength(500);

            entity.Property(club => club.SourceKey)
                .HasMaxLength(220);

            entity.HasMany(club => club.Events)
                .WithOne(@event => @event.Club)
                .HasForeignKey(@event => @event.ClubId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.ToTable("Rooms");

            entity.Property(room => room.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(room => room.Building)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(room => room.Type)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(room => room.Description)
                .HasMaxLength(500);

            entity.Property(room => room.Notes)
                .HasMaxLength(500);

            entity.Property(room => room.SourceKey)
                .HasMaxLength(220);

            entity.HasIndex(room => new { room.Name, room.Building })
                .IsUnique();

            entity.HasMany(room => room.Events)
                .WithOne(@event => @event.Room)
                .HasForeignKey(@event => @event.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable("Events");

            entity.Property(@event => @event.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(@event => @event.Description)
                .HasMaxLength(2000);

            entity.Property(@event => @event.Category)
                .HasMaxLength(120);

            entity.Property(@event => @event.Campus)
                .HasMaxLength(120);

            entity.Property(@event => @event.Format)
                .HasMaxLength(80);

            entity.Property(@event => @event.ImageUrl)
                .HasMaxLength(500);

            entity.Property(@event => @event.LocationDetails)
                .HasMaxLength(300);

            entity.Property(@event => @event.OrganizerText)
                .HasMaxLength(1000);

            entity.Property(@event => @event.LocationText)
                .HasMaxLength(500);

            entity.Property(@event => @event.SourceName)
                .HasMaxLength(180);

            entity.Property(@event => @event.SourceKey)
                .HasMaxLength(260);

            entity.Property(@event => @event.Status)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(@event => @event.PosterCost)
                .HasPrecision(18, 2);

            entity.Property(@event => @event.CateringCost)
                .HasPrecision(18, 2);

            entity.Property(@event => @event.SpeakerFee)
                .HasPrecision(18, 2);

            entity.Property(@event => @event.Price)
                .HasPrecision(18, 2);

            entity.HasOne(@event => @event.Club)
                .WithMany(club => club.Events)
                .HasForeignKey(@event => @event.ClubId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(@event => @event.Room)
                .WithMany(room => room.Events)
                .HasForeignKey(@event => @event.RoomId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ClubStatistic>(entity =>
        {
            entity.ToTable("ClubStatistics");

            entity.Property(statistic => statistic.AcademicYear)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(statistic => statistic.FacultyDistributionJson)
                .IsRequired();

            entity.Property(statistic => statistic.DepartmentDistributionJson)
                .IsRequired();

            entity.HasIndex(statistic => new { statistic.ClubId, statistic.AcademicYear })
                .IsUnique();

            entity.HasOne(statistic => statistic.Club)
                .WithMany(club => club.Statistics)
                .HasForeignKey(statistic => statistic.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImportRun>(entity =>
        {
            entity.ToTable("ImportRuns");

            entity.Property(run => run.Source)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(run => run.WarningSummaryJson)
                .IsRequired();
        });

        modelBuilder.Entity<Registration>(entity =>
        {
            entity.ToTable("Registrations");

            entity.Property(registration => registration.Status)
                .HasMaxLength(40)
                .HasDefaultValue("Approved")
                .IsRequired();

            entity.HasIndex(registration => new { registration.UserId, registration.EventId })
                .IsUnique();

            entity.HasOne(registration => registration.User)
                .WithMany(user => user.Registrations)
                .HasForeignKey(registration => registration.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(registration => registration.Event)
                .WithMany(@event => @event.Registrations)
                .HasForeignKey(registration => registration.EventId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EventReview>(entity =>
        {
            entity.ToTable("EventReviews");

            entity.Property(review => review.Rating)
                .IsRequired();

            entity.Property(review => review.Comment)
                .HasMaxLength(1000);

            entity.HasIndex(review => new { review.UserId, review.EventId })
                .IsUnique();

            entity.HasOne(review => review.User)
                .WithMany(user => user.Reviews)
                .HasForeignKey(review => review.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(review => review.Event)
                .WithMany(@event => @event.Reviews)
                .HasForeignKey(review => review.EventId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ClubMembership>(entity =>
        {
            entity.ToTable("ClubMemberships");

            entity.Property(membership => membership.Role)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(membership => membership.Status)
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(membership => new { membership.ClubId, membership.UserId })
                .IsUnique();

            entity.HasOne(membership => membership.Club)
                .WithMany(club => club.Memberships)
                .HasForeignKey(membership => membership.ClubId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(membership => membership.User)
                .WithMany(user => user.ClubMemberships)
                .HasForeignKey(membership => membership.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");

            entity.Property(notification => notification.Title)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(notification => notification.Message)
                .HasMaxLength(1200)
                .IsRequired();

            entity.Property(notification => notification.Type)
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(notification => notification.RelatedLink)
                .HasMaxLength(400);

            entity.HasOne(notification => notification.User)
                .WithMany(user => user.Notifications)
                .HasForeignKey(notification => notification.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MessageThread>(entity =>
        {
            entity.ToTable("MessageThreads");

            entity.Property(thread => thread.Subject)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(thread => thread.Status)
                .HasMaxLength(40)
                .IsRequired();

            entity.HasOne(thread => thread.Club)
                .WithMany(club => club.MessageThreads)
                .HasForeignKey(thread => thread.ClubId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(thread => thread.Student)
                .WithMany(user => user.StudentMessageThreads)
                .HasForeignKey(thread => thread.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("Messages");

            entity.Property(message => message.Body)
                .HasMaxLength(4000)
                .IsRequired();

            entity.HasOne(message => message.Thread)
                .WithMany(thread => thread.Messages)
                .HasForeignKey(message => message.ThreadId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(message => message.SenderUser)
                .WithMany(user => user.Messages)
                .HasForeignKey(message => message.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MessageThreadReadState>(entity =>
        {
            entity.ToTable("MessageThreadReadStates");

            entity.HasIndex(state => new { state.ThreadId, state.UserId })
                .IsUnique();

            entity.HasOne(state => state.Thread)
                .WithMany(thread => thread.ReadStates)
                .HasForeignKey(state => state.ThreadId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(state => state.User)
                .WithMany(user => user.MessageThreadReadStates)
                .HasForeignKey(state => state.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
