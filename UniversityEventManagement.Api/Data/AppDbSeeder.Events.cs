using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Data;

public static partial class AppDbSeeder
{
    private static List<Event> CreateEvents(DateTime now, Club[] clubs, Room[] rooms)
    {
        var plans = new List<Event>();

        AddClubEvents(plans, now, clubs[0].Id, rooms,
            ("AI Ürün Günleri", "Geçen haftanın buluşmasında yapay zekâ ile geliştirilen öğrenci projeleri sahneye çıktı.", "Teknoloji", 0, -11, 13, 4, false, true, 0m, "Konferans fuayesi ve demo alanı", "Marmara Eğitim Köyü", "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1400&q=80"),
            ("No-Code Atölyesi", "Öğrenciler fikirlerini hızlı prototipe dönüştürmek için araçları uygulamalı olarak denedi.", "Atölye", 4, -9, 15, 3, true, true, 0m, "Atölye masaları ve ürün geliştirme istasyonları", "Mühendislik Kampüsü", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"),
            ("Girişimcilik Kahvesi", "Ürün fikri olan öğrenciler kısa tanışma ve eşleşme oturumunda bir araya geliyor.", "Networking", 5, 0, Math.Max(now.Hour - 1, 10), 3, false, true, 0m, "Fuaye oturma alanı", "Kültür Merkezi", "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1400&q=80"),
            ("Startup Sprint Hazırlığı", "Ekipler sunum akışlarını mentorlarla prova ediyor.", "Hazırlık Kampı", 4, 3, 14, 3, true, true, 0m, "Bilişim Laboratuvarı 2", "Mühendislik Kampüsü", "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"),
            ("Demo Day Sahnesi", "Öğrenci ekipleri ürünlerini jüriye sunacak.", "Sahne / Demo", 0, 8, 16, 4, false, false, 90m, "Ana konferans sahnesi", "Marmara Eğitim Köyü", "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1400&q=80"),
            ("Ürün Tasarım Kampı", "Tasarım ve teknik ekipler ortak sprintte buluşacak.", "Atölye", 4, 12, 11, 4, true, true, 0m, "Takım çalışma istasyonları", "Mühendislik Kampüsü", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80"));

        AddClubEvents(plans, now, clubs[1].Id, rooms,
            ("Kampüste Kısa Film Gecesi", "Öğrenci kısa filmleri ve yönetmen sohbeti bir araya geldi.", "Gösterim", 2, -10, 18, 3, false, true, 0m, "Film Gösterim Salonu", "İletişim Fakültesi", "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=80"),
            ("Afiş Tasarım Maratonu", "Görsel kimlik ve festival afişleri üzerine yoğun bir stüdyo oturumu yapıldı.", "Tasarım", 5, -8, 14, 3, true, true, 0m, "Sergi çalışma masaları", "Güzel Sanatlar", "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1400&q=80"),
            ("Yönetmenle Sahne Arkası Buluşması", "Seçili film üzerinden anlatı ve çekim dili konuşuluyor.", "Söyleşi", 2, 0, Math.Max(now.Hour - 1, 11), 2, false, true, 0m, "Film Gösterim Salonu", "İletişim Fakültesi", "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80"),
            ("Kısa Film Pitch Oturumu", "Ekipler yeni dönem kısa film projelerini jüriye sunacak.", "Pitch", 1, 2, 17, 3, true, true, 0m, "Pitch sahnesi", "İletişim Fakültesi", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80"),
            ("Açık Hava Film Akşamı", "Kampüs çayırında açık hava gösterimi yapılacak.", "Açık Hava Gösterimi", 6, 9, 20, 2, false, true, 0m, "Açık Hava Etkinlik Çayırı", "Marmara Eğitim Köyü", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=80"),
            ("Görsel Hikâye Atölyesi", "Storyboard, ışık ve sahne planlaması üzerine uygulamalı oturum.", "Atölye", 3, 13, 13, 3, true, true, 0m, "Kara kutu yanı stüdyo alanı", "Güzel Sanatlar", "https://images.unsplash.com/photo-1516321310764-8d5f5e21f3aa?auto=format&fit=crop&w=1400&q=80"));

        AddClubEvents(plans, now, clubs[2].Id, rooms,
            ("Akustik Kampüs Gecesi", "Açık havada düzenlenen akustik performans buluşması yoğun ilgi gördü.", "Konser", 6, -12, 19, 3, false, true, 0m, "Açık Hava Etkinlik Çayırı", "Marmara Eğitim Köyü", "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80"),
            ("Sahne Provası Laboratuvarı", "Kulüp üyeleri ses, ışık ve sahne akışını küçük ekiplerle test etti.", "Prova", 3, -7, 16, 3, true, true, 0m, "Kara Kutu Sahnesi", "Güzel Sanatlar", "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80"),
            ("Canlı Performans Hazırlığı", "Repertuvar ve sahne akışı üzerine son prova yapılıyor.", "Performans", 3, 0, Math.Max(now.Hour - 1, 12), 3, false, true, 0m, "Kara Kutu Sahnesi", "Güzel Sanatlar", "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1400&q=80"),
            ("Müzik Prodüksiyon Atölyesi", "Katılımcılar kayıt, miks ve sahne çıkışı arasındaki bağlantıları görecek.", "Atölye", 3, 4, 13, 3, true, false, 60m, "Prodüksiyon çalışma alanı", "Güzel Sanatlar", "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80"),
            ("Bahar Konseri", "Kampüsün ana açık alanında çok kulüplü bahar konseri düzenlenecek.", "Konser", 6, 8, 20, 3, false, true, 0m, "Açık Hava Etkinlik Çayırı", "Marmara Eğitim Köyü", "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80"),
            ("Sahne Tasarımı Buluşması", "Işık, kostüm ve sahne hareketi üzerine ortak üretim seansı.", "Sahne Tasarımı", 3, 11, 15, 3, true, true, 0m, "Kara Kutu Sahnesi", "Güzel Sanatlar", "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1400&q=80"));

        AddClubEvents(plans, now, clubs[3].Id, rooms,
            ("CV Klinikleri Haftası", "Uzman mentorlarla bire bir CV ve LinkedIn değerlendirme seansları yapıldı.", "Kariyer", 7, -9, 11, 4, true, true, 0m, "Seminer masaları", "Lisansüstü Eğitim Enstitüsü", "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80"),
            ("İnovasyon Sohbetleri", "Yeni mezunlarla öğrencileri buluşturan söyleşi serisinin ilk oturumu tamamlandı.", "Söyleşi", 1, -6, 17, 3, false, true, 0m, "Büyük Amfi", "Hukuk Fakültesi", "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80"),
            ("Mentor Kahvaltısı", "Şirket temsilcileriyle küçük gruplar halinde kariyer sohbetleri yapılıyor.", "Networking", 5, 0, Math.Max(now.Hour - 1, 9), 3, false, true, 0m, "Fuaye kahve alanı", "Kültür Merkezi", "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"),
            ("Staj Başvuru Atölyesi", "Öğrenciler başvuru dosyalarını gözden geçirip mülakat pratiği yapacak.", "Atölye", 7, 2, 14, 3, true, true, 0m, "Seminer Salonu", "Lisansüstü Eğitim Enstitüsü", "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1400&q=80"),
            ("Liderlerle Kariyer Zirvesi", "İş dünyasından konuşmacılar kampüste öğrencilerle buluşacak.", "Zirve", 0, 7, 12, 5, false, false, 75m, "Konferans Salonu", "Marmara Eğitim Köyü", "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1400&q=80"),
            ("İnovasyon Fikri Hızlandırıcısı", "Takımlar kısa sürede problem tespiti ve çözüm üretimi yapacak.", "Hızlandırıcı", 7, 12, 10, 4, true, true, 0m, "Seminer Salonu ve breakout alanı", "Lisansüstü Eğitim Enstitüsü", "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"));

        return plans;
    }

    private static void AddClubEvents(
        ICollection<Event> target,
        DateTime now,
        int clubId,
        Room[] rooms,
        params (string Title, string Description, string Category, int RoomIndex, int DayOffset, int StartHour, int DurationHours, bool RequiresApproval, bool IsFree, decimal Price, string Location, string Campus, string ImageUrl)[] blueprints)
    {
        foreach (var blueprint in blueprints)
        {
            var startDate = now.Date.AddDays(blueprint.DayOffset).AddHours(blueprint.StartHour);
            var endDate = startDate.AddHours(blueprint.DurationHours);

            target.Add(new Event
            {
                Title = blueprint.Title,
                Description = blueprint.Description,
                Category = blueprint.Category,
                Campus = blueprint.Campus,
                Format = "Fiziksel",
                ImageUrl = blueprint.ImageUrl,
                LocationDetails = blueprint.Location,
                ClubId = clubId,
                RoomId = rooms[blueprint.RoomIndex].Id,
                StartDate = startDate,
                EndDate = endDate,
                Capacity = Math.Min(rooms[blueprint.RoomIndex].Capacity, 120),
                RequiresApproval = blueprint.RequiresApproval,
                IsFree = blueprint.IsFree,
                Price = blueprint.IsFree ? 0 : blueprint.Price,
                PosterCost = 1200,
                CateringCost = blueprint.DayOffset < 0 ? 1800 : 2600,
                SpeakerFee = 3200,
                Status = EventService.NormalizeStatus("Upcoming", startDate, endDate),
                ActualAttendanceCount = endDate < now ? 24 : startDate <= now && endDate >= now ? 16 : 0
            });
        }
    }

    private static List<Registration> CreateRegistrations(DateTime now, User[] users, List<Event> events)
    {
        var students = users.Where(user => user.Role == UserRoles.Student).ToArray();
        var registrations = new List<Registration>();

        foreach (var @event in events)
        {
            foreach (var student in students.Take(2))
            {
                var status = @event.RequiresApproval
                    ? @event.EndDate < now ? "Approved" : student == students[0] ? "Approved" : "Pending"
                    : "Approved";

                registrations.Add(new Registration
                {
                    UserId = student.Id,
                    EventId = @event.Id,
                    RegisteredAt = @event.StartDate.AddDays(-3),
                    Status = status,
                    Attended = @event.EndDate < now && status == "Approved"
                });
            }
        }

        return registrations;
    }

    private static List<EventReview> CreateReviews(DateTime now, User[] users, List<Event> events)
    {
        var pastEvents = events.Where(@event => @event.EndDate < now).Take(8).ToList();
        var comments = new[]
        {
            "Akış çok temizdi ve kulüp ekibi tüm katılımcılarla yakından ilgilendi.",
            "Etkinlik hem içeriği hem de atmosferiyle gerçekten güçlüydü.",
            "Sunumlar kısa, etkili ve kampüs için çok değerliydi.",
            "Mekân seçimi ve organizasyon kalitesi oldukça başarılıydı."
        };

        return pastEvents.Select((@event, index) => new EventReview
        {
            EventId = @event.Id,
            UserId = users[5 + (index % 4)].Id,
            Rating = 4 + (index % 2),
            Comment = comments[index % comments.Length],
            CreatedAt = @event.EndDate.AddHours(8)
        }).ToList();
    }
}
