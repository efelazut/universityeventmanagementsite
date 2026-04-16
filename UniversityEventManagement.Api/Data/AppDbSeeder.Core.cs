using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;

namespace UniversityEventManagement.Api.Data;

public static partial class AppDbSeeder
{
    private static Club[] CreateClubs() =>
    [
        new()
        {
            Name = "Yazılım ve Girişimcilik Kulübü",
            Description = "Yazılım ürünleri, yapay zekâ ve girişimcilik kültürü etrafında üretim yapan kampüs topluluğu.",
            Category = "Teknoloji ve Girişimcilik",
            AvatarUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
            BannerUrl = "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
            ShowcaseSummary = "Hackathon hazırlıkları, ürün tasarım buluşmaları ve demo geceleriyle öğrencileri teknoloji sahnesine taşıyor.",
            HighlightTitle = "Koddan ürüne uzanan kulüp deneyimi",
            PresidentName = "Selin Aydın",
            PresidentEmail = "selin.aydin@maltepe.edu.tr",
            IsActive = true
        },
        new()
        {
            Name = "Sinema ve Görsel Sanatlar Kulübü",
            Description = "Film gösterimleri, kısa film atölyeleri ve görsel anlatı üretimleriyle yaşayan yaratıcı topluluk.",
            Category = "Sanat ve Medya",
            AvatarUrl = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
            BannerUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
            ShowcaseSummary = "Kampüs gösterimleri, yönetmen sohbetleri ve sahne arkası üretim süreçleriyle görsel kültürü güçlendiriyor.",
            HighlightTitle = "Kampüsün yaratıcı anlatı sahnesi",
            PresidentName = "Deniz Karaca",
            PresidentEmail = "deniz.karaca@maltepe.edu.tr",
            IsActive = true
        },
        new()
        {
            Name = "Müzik ve Sahne Sanatları Kulübü",
            Description = "Canlı performanslar, akustik buluşmalar ve sahne çalışmalarıyla kampüs ritmini yükselten topluluk.",
            Category = "Müzik ve Performans",
            AvatarUrl = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
            BannerUrl = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80",
            ShowcaseSummary = "Akustik konserler, prova kampları ve sahne tasarımı atölyeleriyle üretim ile performansı bir araya getiriyor.",
            HighlightTitle = "Canlı performans ve sahne üretimi",
            PresidentName = "Barış Çetin",
            PresidentEmail = "baris.cetin@maltepe.edu.tr",
            IsActive = true
        },
        new()
        {
            Name = "Kariyer ve İnovasyon Kulübü",
            Description = "Kariyer planlama, iş dünyası buluşmaları ve yenilikçi fikir geliştirme akışlarını bir araya getiren kulüp.",
            Category = "Kariyer ve Ağ Kurma",
            AvatarUrl = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80",
            BannerUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
            ShowcaseSummary = "Mentor görüşmeleri, CV klinikleri ve inovasyon odaklı söyleşilerle öğrencileri iş hayatına hazırlıyor.",
            HighlightTitle = "Kariyerini güçlendiren kampüs ağı",
            PresidentName = "Zeynep Kaya",
            PresidentEmail = "zeynep.kaya@maltepe.edu.tr",
            IsActive = true
        }
    ];

    private static Room[] CreateRooms() =>
    [
        CreateRoom("Marmara Eğitim Köyü Konferans Salonu", "Marmara Eğitim Köyü", "Konferans Salonu", 320, "Büyük zirveler ve konuşmacı etkinlikleri için kullanılan ana salon."),
        CreateRoom("Hukuk Fakültesi Büyük Amfi", "Hukuk Fakültesi", "Amfi", 240, "Panel, söyleşi ve yüksek katılımlı öğrenci buluşmalarına uygun amfi düzeni."),
        CreateRoom("İletişim Fakültesi Film Gösterim Salonu", "İletişim Fakültesi", "Gösterim Salonu", 140, "Film gösterimleri ve görsel sanat buluşmaları için karartmalı salon."),
        CreateRoom("Güzel Sanatlar Kara Kutu Sahnesi", "Güzel Sanatlar Fakültesi", "Sahne", 120, "Prova ve küçük sahne gösterileri için esnek kullanımlı alan."),
        CreateRoom("Mühendislik Bilişim Laboratuvarı 2", "Mühendislik ve Doğa Bilimleri Fakültesi", "Laboratuvar", 48, "Kod atölyeleri ve ürün geliştirme kampları için donanımlı laboratuvar."),
        CreateRoom("Kültür Merkezi Fuaye Alanı", "Kültür Merkezi", "Fuaye", 180, "Networking buluşmaları ve sergi açılışları için geniş fuaye alanı."),
        CreateRoom("Açık Hava Etkinlik Çayırı", "Marmara Eğitim Köyü", "Açık Alan", 450, "Açık hava konserleri ve kulüp tanıtımları için kampüs çim alanı."),
        CreateRoom("Lisansüstü Seminer Salonu", "Lisansüstü Eğitim Enstitüsü", "Seminer Salonu", 72, "Mentorluk buluşmaları ve workshop'lar için ideal kapalı alan.")
    ];

    private static User[] CreateUsers(Club[] clubs) =>
    [
        CreateUser("Admin Kullanıcı", "admin@maltepe.edu.tr", UserRoles.Admin, "Bilgi Teknolojileri", "Rektörlük", "ADM001", "Personel", null, "Platform yönetimi ve demo senaryo kontrolü.", "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Selin Aydın", "selin.aydin@student.maltepe.edu.tr", UserRoles.ClubManager, "Yazılım Mühendisliği", "Mühendislik ve Doğa Bilimleri", "2023001", "3. Sınıf", clubs[0].Id, "AI odaklı ürün toplulukları kuruyor.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Deniz Karaca", "deniz.karaca@student.maltepe.edu.tr", UserRoles.ClubManager, "Radyo, Televizyon ve Sinema", "İletişim Fakültesi", "2023002", "3. Sınıf", clubs[1].Id, "Kampüs gösterimleri ve kısa film ekipleriyle ilgileniyor.", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Barış Çetin", "baris.cetin@student.maltepe.edu.tr", UserRoles.ClubManager, "Müzik", "Güzel Sanatlar Fakültesi", "2023003", "4. Sınıf", clubs[2].Id, "Canlı performans ve sahne yönetimi ekiplerini koordine ediyor.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Zeynep Kaya", "zeynep.kaya@student.maltepe.edu.tr", UserRoles.ClubManager, "İşletme", "İşletme ve Yönetim Bilimleri", "2023004", "3. Sınıf", clubs[3].Id, "Kariyer oturumları ve inovasyon buluşmalarını organize ediyor.", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Emre Tunç", "emre.tunc@student.maltepe.edu.tr", UserRoles.Student, "Yazılım Mühendisliği", "Mühendislik ve Doğa Bilimleri", "2023101", "2. Sınıf", null, "Hackathon ve girişimcilik etkinliklerine düzenli katılıyor.", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"),
        CreateUser("İrem Şahin", "irem.sahin@student.maltepe.edu.tr", UserRoles.Student, "Görsel İletişim Tasarımı", "Güzel Sanatlar Fakültesi", "2023102", "2. Sınıf", null, "Film gösterimleri ve sergi projeleriyle ilgileniyor.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Mertcan Yıldız", "mertcan.yildiz@student.maltepe.edu.tr", UserRoles.Student, "Müzik", "Güzel Sanatlar Fakültesi", "2023103", "2. Sınıf", null, "Akustik performanslar ve sahne çalışmalarında aktif.", "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Elif Nur Acar", "elifnur.acar@student.maltepe.edu.tr", UserRoles.Student, "Psikoloji", "İnsan ve Toplum Bilimleri", "2023104", "2. Sınıf", null, "Topluluk etkinliklerini takip ediyor ve gönüllü görev alıyor.", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Onur Yalçın", "onur.yalcin@student.maltepe.edu.tr", UserRoles.Student, "Uluslararası Ticaret", "İşletme ve Yönetim Bilimleri", "2023105", "2. Sınıf", null, "Kariyer buluşmaları ve networking etkinlikleriyle ilgileniyor.", "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Yağmur Koç", "yagmur.koc@student.maltepe.edu.tr", UserRoles.Student, "İletişim Tasarımı", "İletişim Fakültesi", "2023106", "1. Sınıf", null, "Görsel sanatlar ve kampüs üretimlerini belgelemeyi seviyor.", "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=400&q=80"),
        CreateUser("Berk Eren", "berk.eren@student.maltepe.edu.tr", UserRoles.Student, "Endüstri Mühendisliği", "Mühendislik ve Doğa Bilimleri", "2023107", "1. Sınıf", null, "Ürün yönetimi ve kulüp etkinlikleri arasında köprü kuruyor.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80")
    ];

    private static ClubMembership[] CreateMemberships(Club[] clubs, User[] users, DateTime now) =>
    [
        CreateMembership(clubs[0].Id, users[1].Id, "President", now.AddMonths(-11)),
        CreateMembership(clubs[0].Id, users[5].Id, "Member", now.AddMonths(-5)),
        CreateMembership(clubs[0].Id, users[11].Id, "Assistant", now.AddMonths(-3)),
        CreateMembership(clubs[1].Id, users[2].Id, "President", now.AddMonths(-10)),
        CreateMembership(clubs[1].Id, users[6].Id, "Assistant", now.AddMonths(-4)),
        CreateMembership(clubs[1].Id, users[10].Id, "Member", now.AddMonths(-2)),
        CreateMembership(clubs[2].Id, users[3].Id, "President", now.AddMonths(-10)),
        CreateMembership(clubs[2].Id, users[7].Id, "Assistant", now.AddMonths(-5)),
        CreateMembership(clubs[2].Id, users[8].Id, "Member", now.AddMonths(-3)),
        CreateMembership(clubs[3].Id, users[4].Id, "President", now.AddMonths(-9)),
        CreateMembership(clubs[3].Id, users[9].Id, "Assistant", now.AddMonths(-4)),
        CreateMembership(clubs[3].Id, users[5].Id, "Member", now.AddMonths(-1)),
        CreateMembership(clubs[3].Id, users[6].Id, "Member", now.AddMonths(-1))
    ];

    private static void PromoteAssistantsToManagers(Club[] clubs, User[] users)
    {
        users[11].Role = UserRoles.ClubManager;
        users[11].ClubId = clubs[0].Id;
        users[6].Role = UserRoles.ClubManager;
        users[6].ClubId = clubs[1].Id;
        users[7].Role = UserRoles.ClubManager;
        users[7].ClubId = clubs[2].Id;
        users[9].Role = UserRoles.ClubManager;
        users[9].ClubId = clubs[3].Id;
    }

    private static Room CreateRoom(string name, string building, string type, int capacity, string description) => new()
    {
        Name = name,
        Building = building,
        Type = type,
        Description = description,
        Capacity = capacity,
        IsAvailable = true
    };

    private static User CreateUser(
        string fullName,
        string email,
        string role,
        string department,
        string faculty,
        string studentNumber,
        string yearClass,
        int? clubId,
        string bio,
        string avatarUrl) => new()
    {
        FullName = fullName,
        Email = email,
        PasswordHash = role == UserRoles.Admin ? "Admin123!" : "Password1!",
        Role = role,
        Department = department,
        Faculty = faculty,
        StudentNumber = studentNumber,
        YearClass = yearClass,
        AvatarUrl = avatarUrl,
        Bio = bio,
        IsActiveMember = true,
        ClubId = clubId
    };

    private static ClubMembership CreateMembership(int clubId, int userId, string role, DateTime joinedAt) => new()
    {
        ClubId = clubId,
        UserId = userId,
        Role = role,
        Status = "Active",
        JoinedAt = joinedAt
    };
}
