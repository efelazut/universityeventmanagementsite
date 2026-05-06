using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UniversityEventManagement.Api.Data;

#nullable disable

namespace UniversityEventManagement.Api.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260505193000_RealSksImportSchema")]
    public partial class RealSksImportSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(name: "FK_Events_Clubs_ClubId", table: "Events");
            migrationBuilder.DropForeignKey(name: "FK_Events_Rooms_RoomId", table: "Events");

            migrationBuilder.AlterColumn<int>(
                name: "RoomId",
                table: "Events",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "ClubId",
                table: "Events",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(name: "OrganizerText", table: "Events", type: "nvarchar(1000)", maxLength: 1000, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "LocationText", table: "Events", type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<int>(name: "ParticipantCount", table: "Events", type: "int", nullable: true);
            migrationBuilder.AddColumn<int>(name: "SourceYear", table: "Events", type: "int", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "IsPastEvent", table: "Events", type: "bit", nullable: false, defaultValue: false);
            migrationBuilder.AddColumn<string>(name: "SourceName", table: "Events", type: "nvarchar(180)", maxLength: 180, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "SourceKey", table: "Events", type: "nvarchar(260)", maxLength: 260, nullable: false, defaultValue: "");

            migrationBuilder.AddColumn<string>(name: "InstagramUrl", table: "Clubs", type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<int>(name: "MemberCapacity", table: "Clubs", type: "int", nullable: true);
            migrationBuilder.AddColumn<int>(name: "DeclaredMemberCount", table: "Clubs", type: "int", nullable: true);
            migrationBuilder.AddColumn<int>(name: "ActualMemberCount", table: "Clubs", type: "int", nullable: true);
            migrationBuilder.AddColumn<string>(name: "AcademicYear", table: "Clubs", type: "nvarchar(40)", maxLength: 40, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "LogoUrl", table: "Clubs", type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "SourceKey", table: "Clubs", type: "nvarchar(220)", maxLength: 220, nullable: false, defaultValue: "");

            migrationBuilder.AddColumn<string>(name: "Notes", table: "Rooms", type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "SourceKey", table: "Rooms", type: "nvarchar(220)", maxLength: 220, nullable: false, defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ClubStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClubId = table.Column<int>(type: "int", nullable: false),
                    AcademicYear = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    TotalMembers = table.Column<int>(type: "int", nullable: false),
                    FacultyDistributionJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentDistributionJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubStatistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClubStatistics_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImportRuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ImportedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    ClubCount = table.Column<int>(type: "int", nullable: false),
                    EventCount = table.Column<int>(type: "int", nullable: false),
                    RoomCount = table.Column<int>(type: "int", nullable: false),
                    ClubStatisticCount = table.Column<int>(type: "int", nullable: false),
                    WarningCount = table.Column<int>(type: "int", nullable: false),
                    WarningSummaryJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImportRuns", x => x.Id);
                });

            migrationBuilder.CreateIndex(name: "IX_ClubStatistics_ClubId_AcademicYear", table: "ClubStatistics", columns: new[] { "ClubId", "AcademicYear" }, unique: true);

            migrationBuilder.AddForeignKey(name: "FK_Events_Clubs_ClubId", table: "Events", column: "ClubId", principalTable: "Clubs", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
            migrationBuilder.AddForeignKey(name: "FK_Events_Rooms_RoomId", table: "Events", column: "RoomId", principalTable: "Rooms", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(name: "FK_Events_Clubs_ClubId", table: "Events");
            migrationBuilder.DropForeignKey(name: "FK_Events_Rooms_RoomId", table: "Events");
            migrationBuilder.DropTable(name: "ClubStatistics");
            migrationBuilder.DropTable(name: "ImportRuns");

            migrationBuilder.DropColumn(name: "OrganizerText", table: "Events");
            migrationBuilder.DropColumn(name: "LocationText", table: "Events");
            migrationBuilder.DropColumn(name: "ParticipantCount", table: "Events");
            migrationBuilder.DropColumn(name: "SourceYear", table: "Events");
            migrationBuilder.DropColumn(name: "IsPastEvent", table: "Events");
            migrationBuilder.DropColumn(name: "SourceName", table: "Events");
            migrationBuilder.DropColumn(name: "SourceKey", table: "Events");
            migrationBuilder.DropColumn(name: "InstagramUrl", table: "Clubs");
            migrationBuilder.DropColumn(name: "MemberCapacity", table: "Clubs");
            migrationBuilder.DropColumn(name: "DeclaredMemberCount", table: "Clubs");
            migrationBuilder.DropColumn(name: "ActualMemberCount", table: "Clubs");
            migrationBuilder.DropColumn(name: "AcademicYear", table: "Clubs");
            migrationBuilder.DropColumn(name: "LogoUrl", table: "Clubs");
            migrationBuilder.DropColumn(name: "SourceKey", table: "Clubs");
            migrationBuilder.DropColumn(name: "Notes", table: "Rooms");
            migrationBuilder.DropColumn(name: "SourceKey", table: "Rooms");

            migrationBuilder.AlterColumn<int>(name: "RoomId", table: "Events", type: "int", nullable: false, defaultValue: 0, oldClrType: typeof(int), oldType: "int", oldNullable: true);
            migrationBuilder.AlterColumn<int>(name: "ClubId", table: "Events", type: "int", nullable: false, defaultValue: 0, oldClrType: typeof(int), oldType: "int", oldNullable: true);

            migrationBuilder.AddForeignKey(name: "FK_Events_Clubs_ClubId", table: "Events", column: "ClubId", principalTable: "Clubs", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Events_Rooms_RoomId", table: "Events", column: "RoomId", principalTable: "Rooms", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        }
    }
}
