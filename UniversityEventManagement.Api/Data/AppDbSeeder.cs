using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Data;

public static partial class AppDbSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    public static async Task SeedAsync(AppDbContext dbContext)
    {
        if (await dbContext.ImportRuns.AnyAsync())
        {
            await EnsureSystemUsersAsync(dbContext);
            await EnsureFeaturedUpcomingEventsAsync(dbContext);
            return;
        }

        var seedRoot = Path.Combine(AppContext.BaseDirectory, "Data", "Seed");
        if (!Directory.Exists(seedRoot))
        {
            seedRoot = Path.Combine(Directory.GetCurrentDirectory(), "Data", "Seed");
        }

        if (!Directory.Exists(seedRoot))
        {
            await EnsureSystemUsersAsync(dbContext);
            return;
        }

        await ReplaceDemoDataAsync(dbContext);
        await EnsureSystemUsersAsync(dbContext);

        var rooms = ReadSeed<List<RoomSeed>>(seedRoot, "seed-rooms.json");
        var clubs = ReadSeed<List<ClubSeed>>(seedRoot, "seed-clubs.json");
        var events = ReadSeed<List<EventSeed>>(seedRoot, "seed-events.json");
        var statistics = ReadSeed<List<ClubStatisticSeed>>(seedRoot, "seed-club-statistics.json");
        var warnings = ReadSeed<List<ImportWarningSeed>>(seedRoot, "import-warnings.json");

        var roomEntities = rooms
            .Where(room => !string.IsNullOrWhiteSpace(room.Name))
            .GroupBy(room => NormalizeKey(CleanRoomName(room.Name)))
            .Select(group => group.First())
            .Select(room => new Room
            {
                Name = CleanRoomName(room.Name),
                Building = string.IsNullOrWhiteSpace(room.Building) ? "Maltepe Üniversitesi" : room.Building.Trim(),
                Type = "Etkinlik Salonu",
                Description = room.Notes?.Trim() ?? string.Empty,
                Notes = room.Notes?.Trim() ?? string.Empty,
                Capacity = room.Capacity ?? 0,
                IsAvailable = true,
                SourceKey = NormalizeKey(CleanRoomName(room.Name))
            })
            .ToList();

        dbContext.Rooms.AddRange(roomEntities);
        await dbContext.SaveChangesAsync();

        var clubEntities = clubs
            .Where(club => !string.IsNullOrWhiteSpace(club.Name))
            .GroupBy(club => NormalizeKey(CleanClubName(club.Name)))
            .Select(group => group.First())
            .Select(club => new Club
            {
                Name = CleanClubName(club.Name),
                Description = club.Description?.Trim() ?? string.Empty,
                Category = string.IsNullOrWhiteSpace(club.Category) ? "Kulüp" : club.Category.Trim(),
                AvatarUrl = club.LogoUrl?.Trim() ?? string.Empty,
                BannerUrl = string.Empty,
                ShowcaseSummary = club.Description?.Trim() ?? string.Empty,
                HighlightTitle = string.Empty,
                PresidentName = "SKS",
                PresidentEmail = "sks@maltepe.edu.tr",
                InstagramUrl = club.InstagramUrl?.Trim() ?? string.Empty,
                MemberCapacity = club.DeclaredMemberCount,
                DeclaredMemberCount = club.DeclaredMemberCount,
                ActualMemberCount = club.ActualMemberCount,
                AcademicYear = club.AcademicYear?.Trim() ?? string.Empty,
                LogoUrl = club.LogoUrl?.Trim() ?? string.Empty,
                IsActive = club.IsActive,
                SourceKey = NormalizeKey(CleanClubName(club.Name))
            })
            .ToList();

        dbContext.Clubs.AddRange(clubEntities);
        await dbContext.SaveChangesAsync();
        await EnsurePresentationUsersAsync(dbContext, clubEntities);
        await EnsureClubTeamsAndFollowersAsync(dbContext, clubEntities);

        var clubByKey = clubEntities.ToDictionary(club => club.SourceKey, club => club);
        var eventEntities = new List<Event>();
        foreach (var item in events.Where(item => !string.IsNullOrWhiteSpace(item.Title)))
        {
            var startDate = ResolveEventDate(item);
            var club = !string.IsNullOrWhiteSpace(item.ClubName) && clubByKey.TryGetValue(NormalizeKey(item.ClubName), out var matchedClub)
                ? matchedClub
                : null;

            eventEntities.Add(new Event
            {
                Title = item.Title.Trim(),
                Description = item.Description?.Trim() ?? string.Empty,
                Category = item.SourceYear?.ToString() ?? "SKS",
                Campus = "Maltepe Üniversitesi",
                Format = "Fiziksel",
                ImageUrl = string.Empty,
                LocationDetails = item.LocationText?.Trim() ?? string.Empty,
                LocationText = item.LocationText?.Trim() ?? string.Empty,
                OrganizerText = item.OrganizerText?.Trim() ?? string.Empty,
                StartDate = startDate,
                EndDate = startDate.AddHours(2),
                Capacity = item.Capacity ?? item.ParticipantCount ?? 0,
                RequiresApproval = false,
                IsFree = true,
                Price = 0,
                ClubId = club?.Id,
                RoomId = null,
                PosterCost = 0,
                CateringCost = 0,
                SpeakerFee = 0,
                Status = EventService.NormalizeStatus(item.IsPastEvent ? "Completed" : "Upcoming", startDate, startDate.AddHours(2)),
                ActualAttendanceCount = item.ParticipantCount ?? 0,
                ParticipantCount = item.ParticipantCount,
                SourceYear = item.SourceYear,
                IsPastEvent = item.IsPastEvent,
                SourceName = item.Source?.Trim() ?? string.Empty,
                SourceKey = Truncate(NormalizeKey($"{item.SourceYear}|{item.Title}|{item.Date}|{item.OrganizerText}"), 240)
            });
        }

        dbContext.Events.AddRange(eventEntities.GroupBy(item => item.SourceKey).Select(group => group.First()));
        await dbContext.SaveChangesAsync();
        await EnsureFeaturedUpcomingEventsAsync(dbContext);

        foreach (var statistic in statistics)
        {
            if (string.IsNullOrWhiteSpace(statistic.ClubName) || string.IsNullOrWhiteSpace(statistic.AcademicYear))
            {
                continue;
            }

            if (!clubByKey.TryGetValue(NormalizeKey(statistic.ClubName), out var club))
            {
                continue;
            }

            dbContext.ClubStatistics.Add(new ClubStatistic
            {
                ClubId = club.Id,
                AcademicYear = statistic.AcademicYear.Trim(),
                TotalMembers = statistic.TotalMembers,
                FacultyDistributionJson = JsonSerializer.Serialize(statistic.FacultyDistribution ?? new Dictionary<string, int>(), JsonOptions),
                DepartmentDistributionJson = JsonSerializer.Serialize(statistic.DepartmentDistribution ?? new Dictionary<string, int>(), JsonOptions)
            });
        }

        await dbContext.SaveChangesAsync();

        dbContext.ImportRuns.Add(new ImportRun
        {
            ImportedAt = DateTime.UtcNow,
            Source = "Maltepe SKS gerçek veri seed",
            ClubCount = await dbContext.Clubs.CountAsync(),
            EventCount = await dbContext.Events.CountAsync(),
            RoomCount = await dbContext.Rooms.CountAsync(),
            ClubStatisticCount = await dbContext.ClubStatistics.CountAsync(),
            WarningCount = warnings.Count,
            WarningSummaryJson = JsonSerializer.Serialize(warnings.Take(50).Select(warning => $"{warning.Source} satır {warning.Row}: {warning.Message}").ToList(), JsonOptions)
        });

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureFeaturedUpcomingEventsAsync(AppDbContext dbContext)
    {
        var ankaClub = await dbContext.Clubs.FirstOrDefaultAsync(club => club.Name == "Anka Yazılım Kulübü");
        var animalClub = await dbContext.Clubs.FirstOrDefaultAsync(club => club.Name == "Hayvan Dostları Kulübü");

        var careerStart = DateTime.UtcNow.Date.AddHours(17);
        if (careerStart <= DateTime.UtcNow.AddMinutes(5))
        {
            careerStart = DateTime.UtcNow.Date.AddDays(1).AddHours(17);
        }

        var events = new[]
        {
            new FeaturedEventSeed(
                SourceKey: "featured|anka|cv-mulakat-teknikleri|2026-05",
                Title: "Etkili CV Hazırlama ve Mülakat Teknikleri",
                Description: "Dr. Öğr. Üyesi Ferhat Değer ve Norman Mammaddli ile CV hazırlama süreçleri, teknik mülakatlar, kariyer planlaması ve işe alım süreçleri üzerine konuşulacak kariyer odaklı online etkinlik. Google Meet: https://meet.google.com/xbj-yhtz-knr",
                Category: "Kariyer / Yazılım",
                Format: "Online",
                Location: "Google Meet: https://meet.google.com/xbj-yhtz-knr",
                Organizer: "Anka Yazılım Kulübü",
                ImageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
                StartDate: careerStart,
                EndDate: careerStart.AddHours(2),
                Capacity: 120,
                ClubId: ankaClub?.Id),
            new FeaturedEventSeed(
                SourceKey: "featured|anka|mezun-gunleri-3-matcha-talk|2026-05-11",
                Title: "Mezun Günleri #3 - Matcha Talk",
                Description: "Anka Yazılım Kulübü olarak Matcha Talk etkinliğinde bir araya geliyoruz. Yoğun geçen dönemin ardından projeleri değerlendirmek, gelecek dönem planlarını konuşmak ve samimi bir ortamda sohbet etmek amacıyla düzenlenen sosyal buluşma etkinliği. Detaylar: matcha temalı sosyal buluşma, kulüp içi networking, dönem değerlendirmesi ve gelecek dönem planlaması.",
                Category: "Sosyal / Networking",
                Format: "Fiziksel",
                Location: "TAICO Kadıköy",
                Organizer: "Anka Yazılım Kulübü",
                ImageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80",
                StartDate: UtcDate(2026, 5, 11, 12, 30),
                EndDate: UtcDate(2026, 5, 11, 15, 0),
                Capacity: 25,
                ClubId: ankaClub?.Id),
            new FeaturedEventSeed(
                SourceKey: "featured|hayvan-dostlari|sokak-hayvanlari-kermesi|2027-04-08",
                Title: "4 Nisan Dünya Sokak Hayvanları Günü Kermesi",
                Description: "Sokak hayvanlarına destek amacıyla düzenlenen kermes etkinliği. Gün boyunca çeşitli stantlar, bağış alanları ve sosyal sorumluluk aktiviteleri gerçekleştirilecektir.",
                Category: "Sosyal Sorumluluk",
                Format: "Fiziksel",
                Location: "Kültür Merkezi",
                Organizer: "Hayvan Dostları Kulübü",
                ImageUrl: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=80",
                StartDate: UtcDate(2027, 4, 8, 7, 0),
                EndDate: UtcDate(2027, 4, 8, 14, 0),
                Capacity: 250,
                ClubId: animalClub?.Id)
        };

        foreach (var seed in events)
        {
            var existing = await dbContext.Events.FirstOrDefaultAsync(@event => @event.SourceKey == seed.SourceKey);
            if (existing is null)
            {
                dbContext.Events.Add(new Event
                {
                    SourceKey = seed.SourceKey,
                    Title = seed.Title,
                    Description = seed.Description,
                    Category = seed.Category,
                    Campus = "Maltepe Üniversitesi",
                    Format = seed.Format,
                    ImageUrl = seed.ImageUrl,
                    LocationDetails = seed.Location,
                    LocationText = seed.Location,
                    OrganizerText = seed.Organizer,
                    StartDate = seed.StartDate,
                    EndDate = seed.EndDate,
                    Capacity = seed.Capacity,
                    RequiresApproval = false,
                    IsFree = true,
                    Price = 0,
                    ClubId = seed.ClubId,
                    RoomId = null,
                    PosterCost = 0,
                    CateringCost = 0,
                    SpeakerFee = 0,
                    Status = EventService.NormalizeStatus("Upcoming", seed.StartDate, seed.EndDate),
                    ActualAttendanceCount = 0,
                    ParticipantCount = null,
                    SourceYear = seed.StartDate.Year,
                    IsPastEvent = false,
                    SourceName = "UniConnect yaklaşan etkinlik seed"
                });
                continue;
            }

            existing.Title = seed.Title;
            existing.Description = seed.Description;
            existing.Category = seed.Category;
            existing.Format = seed.Format;
            existing.ImageUrl = seed.ImageUrl;
            existing.LocationDetails = seed.Location;
            existing.LocationText = seed.Location;
            existing.OrganizerText = seed.Organizer;
            existing.StartDate = seed.StartDate;
            existing.EndDate = seed.EndDate;
            existing.Capacity = seed.Capacity;
            existing.ClubId = seed.ClubId;
            existing.Status = EventService.NormalizeStatus("Upcoming", seed.StartDate, seed.EndDate);
            existing.IsPastEvent = false;
            existing.SourceYear = seed.StartDate.Year;
            existing.SourceName = "UniConnect yaklaşan etkinlik seed";
        }

        await dbContext.SaveChangesAsync();

        var latestImport = await dbContext.ImportRuns.OrderByDescending(run => run.ImportedAt).FirstOrDefaultAsync();
        if (latestImport is not null)
        {
            latestImport.EventCount = await dbContext.Events.CountAsync();
            await dbContext.SaveChangesAsync();
        }
    }

    public static async Task ReseedAsync(AppDbContext dbContext)
    {
        dbContext.ImportRuns.RemoveRange(dbContext.ImportRuns);
        await dbContext.SaveChangesAsync();
        await SeedAsync(dbContext);
    }

    private static async Task EnsureSystemUsersAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Users.AnyAsync(user => user.Email == "admin@maltepe.edu.tr"))
        {
            dbContext.Users.Add(new User
            {
                FullName = "Sistem Yöneticisi",
                Email = "admin@maltepe.edu.tr",
                PasswordHash = "Admin123!",
                Role = UserRoles.Admin,
                Department = "SKS",
                Faculty = "Maltepe Üniversitesi",
                StudentNumber = "ADMIN",
                YearClass = "Personel",
                Bio = "Sistem yönetimi",
                IsActiveMember = true
            });
        }

        if (!await dbContext.Users.AnyAsync(user => user.Email == "test@student.maltepe.edu.tr"))
        {
            dbContext.Users.Add(new User
            {
                FullName = "Test Öğrencisi",
                Email = "test@student.maltepe.edu.tr",
                PasswordHash = "Password1!",
                Role = UserRoles.Student,
                Department = "Test",
                Faculty = "Maltepe Üniversitesi",
                StudentNumber = "TEST001",
                YearClass = "Test",
                Bio = "Test hesabı",
                IsActiveMember = false
            });
        }

        await dbContext.SaveChangesAsync();

        var assignedManagerIds = await dbContext.ClubManagers.Select(manager => manager.UserId).ToListAsync();
        var staleManagerUsers = await dbContext.Users
            .Where(user => user.Role == UserRoles.ClubManager && !assignedManagerIds.Contains(user.Id))
            .ToListAsync();

        foreach (var staleUser in staleManagerUsers)
        {
            staleUser.Role = UserRoles.Student;
            staleUser.ClubId = null;
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsurePresentationUsersAsync(AppDbContext dbContext, IReadOnlyList<Club> clubs)
    {
        var ankaClub = clubs.FirstOrDefault(club => club.Name.Contains("Anka", StringComparison.OrdinalIgnoreCase));
        var sinemaClub = clubs.FirstOrDefault(club => club.Name.Contains("Sinema", StringComparison.OrdinalIgnoreCase));
        var hukukClub = clubs.FirstOrDefault(club => club.Name.Contains("Hukuk", StringComparison.OrdinalIgnoreCase));

        var users = new[]
        {
            new User { FullName = "Anka Kulüp Yöneticisi", Email = "anka.yonetici@uniconnect.edu.tr", PasswordHash = "Password1!", Role = UserRoles.ClubManager, Department = "Yazılım Mühendisliği", Faculty = "Mühendislik ve Doğa Bilimleri Fakültesi", StudentNumber = "KULUP001", YearClass = "3. Sınıf", Bio = "Anka Yazılım Kulübü yönetici hesabı.", IsActiveMember = true, ClubId = ankaClub?.Id },
            new User { FullName = "Sinema Kulüp Yöneticisi", Email = "sinema.yonetici@uniconnect.edu.tr", PasswordHash = "Password1!", Role = UserRoles.ClubManager, Department = "Radyo, Televizyon ve Sinema", Faculty = "İletişim Fakültesi", StudentNumber = "KULUP002", YearClass = "4. Sınıf", Bio = "Sinema Kulübü yönetici hesabı.", IsActiveMember = true, ClubId = sinemaClub?.Id },
            new User { FullName = "Hukuk Kulüp Yöneticisi", Email = "hukuk.yonetici@uniconnect.edu.tr", PasswordHash = "Password1!", Role = UserRoles.ClubManager, Department = "Hukuk", Faculty = "Hukuk Fakültesi", StudentNumber = "KULUP003", YearClass = "3. Sınıf", Bio = "Hukuk Kulübü yönetici hesabı.", IsActiveMember = true, ClubId = hukukClub?.Id },
            new User { FullName = "Emre Tunç", Email = "emre.tunc@student.maltepe.edu.tr", PasswordHash = "Password1!", Role = UserRoles.Student, Department = "Yazılım Mühendisliği", Faculty = "Mühendislik ve Doğa Bilimleri Fakültesi", StudentNumber = "STU001", YearClass = "2. Sınıf", Bio = "Sunum için öğrenci test hesabı.", IsActiveMember = true },
            new User { FullName = "Elif Nur Acar", Email = "elif.acar@student.maltepe.edu.tr", PasswordHash = "Password1!", Role = UserRoles.Student, Department = "Psikoloji", Faculty = "İnsan ve Toplum Bilimleri Fakültesi", StudentNumber = "STU002", YearClass = "3. Sınıf", Bio = "Sunum için öğrenci test hesabı.", IsActiveMember = true },
            new User { FullName = "Deniz Kaya", Email = "deniz.kaya@student.maltepe.edu.tr", PasswordHash = "Password1!", Role = UserRoles.Student, Department = "İşletme", Faculty = "İşletme ve Yönetim Bilimleri Fakültesi", StudentNumber = "STU003", YearClass = "1. Sınıf", Bio = "Sunum için öğrenci test hesabı.", IsActiveMember = false }
        };

        foreach (var user in users)
        {
            var existing = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == user.Email);
            if (existing is null)
            {
                dbContext.Users.Add(user);
            }
            else
            {
                existing.FullName = user.FullName;
                existing.PasswordHash = user.PasswordHash;
                existing.Role = user.Role;
                existing.Department = user.Department;
                existing.Faculty = user.Faculty;
                existing.StudentNumber = user.StudentNumber;
                existing.YearClass = user.YearClass;
                existing.Bio = user.Bio;
                existing.IsActiveMember = user.IsActiveMember;
                existing.ClubId = user.ClubId;
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureClubTeamsAndFollowersAsync(AppDbContext dbContext, IReadOnlyList<Club> clubs)
    {
        if (clubs.Count == 0)
        {
            return;
        }

        var users = await dbContext.Users.ToListAsync();
        var studentUsers = users.Where(user => user.Role == UserRoles.Student).ToList();

        for (var index = 0; index < clubs.Count; index++)
        {
            var club = clubs[index];
            var presidentEmail = $"club-{club.Id}-president@uniconnect.edu.tr";
            var president = users.FirstOrDefault(user => user.Email == presidentEmail);
            if (president is null)
            {
                president = new User
                {
                    FullName = $"{club.Name} Başkanı",
                    Email = presidentEmail,
                    PasswordHash = "Password1!",
                    Role = UserRoles.ClubManager,
                    Department = club.Category,
                    Faculty = "Öğrenci Toplulukları",
                    StudentNumber = $"PRES{club.Id:0000}",
                    YearClass = "Yönetim",
                    Bio = $"{club.Name} başkan hesabı.",
                    IsActiveMember = true,
                    ClubId = club.Id
                };
                dbContext.Users.Add(president);
                users.Add(president);
                await dbContext.SaveChangesAsync();
            }

            if (!await dbContext.ClubManagers.AnyAsync(item => item.UserId == president.Id))
            {
                dbContext.ClubManagers.Add(new ClubManager
                {
                    ClubId = club.Id,
                    UserId = president.Id,
                    Role = "President"
                });
            }

            president.Role = UserRoles.ClubManager;
            president.ClubId = club.Id;
            club.PresidentName = president.FullName;
            club.PresidentEmail = president.Email;

            if (index < 4)
            {
                var assistantEmail = $"club-{club.Id}-manager@uniconnect.edu.tr";
                var assistant = users.FirstOrDefault(user => user.Email == assistantEmail);
                if (assistant is null)
                {
                    assistant = new User
                    {
                        FullName = $"{club.Name} Yöneticisi",
                        Email = assistantEmail,
                        PasswordHash = "Password1!",
                        Role = UserRoles.ClubManager,
                        Department = club.Category,
                        Faculty = "Öğrenci Toplulukları",
                        StudentNumber = $"MGR{club.Id:0000}",
                        YearClass = "Yönetim",
                        Bio = $"{club.Name} yönetici hesabı.",
                        IsActiveMember = true,
                        ClubId = club.Id
                    };
                    dbContext.Users.Add(assistant);
                    users.Add(assistant);
                    await dbContext.SaveChangesAsync();
                }

                if (!await dbContext.ClubManagers.AnyAsync(item => item.UserId == assistant.Id))
                {
                    dbContext.ClubManagers.Add(new ClubManager
                    {
                        ClubId = club.Id,
                        UserId = assistant.Id,
                        Role = "Manager"
                    });
                }
            }

            foreach (var follower in studentUsers.Skip(index % Math.Max(studentUsers.Count, 1)).Take(3))
            {
                if (!await dbContext.ClubFollowers.AnyAsync(item => item.ClubId == club.Id && item.UserId == follower.Id))
                {
                    dbContext.ClubFollowers.Add(new ClubFollower
                    {
                        ClubId = club.Id,
                        UserId = follower.Id,
                        FollowedAt = DateTime.UtcNow.AddDays(-index)
                    });
                }
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task ReplaceDemoDataAsync(AppDbContext dbContext)
    {
        dbContext.EventReviews.RemoveRange(dbContext.EventReviews);
        dbContext.Registrations.RemoveRange(dbContext.Registrations);
        dbContext.Notifications.RemoveRange(dbContext.Notifications);
        dbContext.MessageThreadReadStates.RemoveRange(dbContext.MessageThreadReadStates);
        dbContext.Messages.RemoveRange(dbContext.Messages);
        dbContext.MessageThreads.RemoveRange(dbContext.MessageThreads);
        dbContext.ClubFollowers.RemoveRange(dbContext.ClubFollowers);
        dbContext.ClubManagers.RemoveRange(dbContext.ClubManagers);
        dbContext.Events.RemoveRange(dbContext.Events);
        dbContext.ClubStatistics.RemoveRange(dbContext.ClubStatistics);
        dbContext.Rooms.RemoveRange(dbContext.Rooms);
        dbContext.Clubs.RemoveRange(dbContext.Clubs);

        var nonAdminUsers = await dbContext.Users
            .Where(user => user.Role != UserRoles.Admin)
            .ToListAsync();
        dbContext.Users.RemoveRange(nonAdminUsers);

        await dbContext.SaveChangesAsync();
    }

    private static T ReadSeed<T>(string root, string fileName) where T : new()
    {
        var path = Path.Combine(root, fileName);
        return File.Exists(path)
            ? JsonSerializer.Deserialize<T>(File.ReadAllText(path), JsonOptions) ?? new T()
            : new T();
    }

    private static DateTime ResolveEventDate(EventSeed seed)
    {
        if (DateTime.TryParse(seed.Date, out var parsed))
        {
            return UtcDate(parsed.Year, parsed.Month, parsed.Day, 12);
        }

        return UtcDate(seed.SourceYear ?? DateTime.UtcNow.Year, 1, 1, 12);
    }

    private static DateTime UtcDate(int year, int month, int day, int hour = 0, int minute = 0) =>
        new(year, month, day, hour, minute, 0, DateTimeKind.Utc);

    private static string CleanClubName(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        text = Regex.Replace(text, "\\s+", " ");
        text = Regex.Replace(text, "^(Maltepe Universitesi|Maltepe Üniversitesi|MAU|Mau)\\s+", string.Empty, RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "\\bKulubu\\s+Kulubu\\b", "Kulubu", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "\\bKulübü\\s+Kulübü\\b", "Kulübü", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "\\bToplulugu\\b", "Topluluğu", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "\\bVe\\b", "ve");
        text = text.Replace("Arama ve Kurtama", "Arama ve Kurtarma", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("GDSC Kulübü (Gdg on campus)", "Google Developer Groups On Campus Kulübü", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("GDSC Kulübü", "Google Developer Student Clubs Kulübü", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("Mau Oyun", "Oyun", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("Mau Veganizm", "Veganizm", StringComparison.OrdinalIgnoreCase);
        return text.Trim();
    }

    private static string CleanRoomName(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        text = Regex.Replace(text, "\\s+", " ");
        text = Regex.Replace(text, "\\bfak\\.?\\b", "Fakültesi", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "\\bFak\\.\\b", "Fakültesi", RegexOptions.IgnoreCase);
        text = text.Replace("Fakültesi.", "Fakültesi", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("Konferans Salonu(", "Konferans Salonu (", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("İnsan ve toplum bilimleri", "İnsan ve Toplum Bilimleri", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("Eğitim Fakültesi amfi", "Eğitim Fakültesi Amfi", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("İnsan ve Toplum Bilimleri Fakültesi Amfi", "İnsan ve Toplum Bilimleri Fakültesi Amfi", StringComparison.OrdinalIgnoreCase);
        text = text.Replace("Süha Arın Konferans Salonu(İletişim Fakültesi)", "Süha Arın Konferans Salonu (İletişim Fakültesi)", StringComparison.OrdinalIgnoreCase);
        return text.Trim();
    }

    private static string NormalizeKey(string? value)
    {
        var text = (value ?? string.Empty).Trim().ToLowerInvariant()
            .Replace('ı', 'i')
            .Replace('ğ', 'g')
            .Replace('ü', 'u')
            .Replace('ş', 's')
            .Replace('ö', 'o')
            .Replace('ç', 'c');

        foreach (var removable in new[]
        {
            "maltepe universitesi",
            "saglik kultur ve spor daire baskanligi",
            "saglik, kultur ve spor daire baskanligi",
            "sks",
            "mau",
            "kulubu",
            "toplulugu",
            "universitesi"
        })
        {
            text = text.Replace(removable, " ");
        }

        return Regex.Replace(Regex.Replace(text, "[^a-z0-9]+", " "), "\\s+", " ").Trim();
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private sealed class RoomSeed
    {
        public string Name { get; set; } = string.Empty;
        public int? Capacity { get; set; }
        public string? Building { get; set; }
        public string? Notes { get; set; }
    }

    private sealed class ClubSeed
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? InstagramUrl { get; set; }
        public int? DeclaredMemberCount { get; set; }
        public int? ActualMemberCount { get; set; }
        public string? AcademicYear { get; set; }
        public string? Category { get; set; }
        public string? LogoUrl { get; set; }
        public bool IsActive { get; set; } = true;
    }

    private sealed class EventSeed
    {
        public string Title { get; set; } = string.Empty;
        public string? Date { get; set; }
        public string? OrganizerText { get; set; }
        public string? ClubName { get; set; }
        public string? RoomName { get; set; }
        public string? LocationText { get; set; }
        public int? ParticipantCount { get; set; }
        public int? Capacity { get; set; }
        public int? SourceYear { get; set; }
        public bool IsPastEvent { get; set; }
        public string? Description { get; set; }
        public string? Source { get; set; }
    }

    private sealed record FeaturedEventSeed(
        string SourceKey,
        string Title,
        string Description,
        string Category,
        string Format,
        string Location,
        string Organizer,
        string ImageUrl,
        DateTime StartDate,
        DateTime EndDate,
        int Capacity,
        int? ClubId);

    private sealed class ClubStatisticSeed
    {
        public string ClubName { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public int TotalMembers { get; set; }
        public Dictionary<string, int>? FacultyDistribution { get; set; }
        public Dictionary<string, int>? DepartmentDistribution { get; set; }
    }

    private sealed class ImportWarningSeed
    {
        public string Source { get; set; } = string.Empty;
        public int Row { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
