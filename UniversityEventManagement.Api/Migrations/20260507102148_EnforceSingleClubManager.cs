using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniversityEventManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnforceSingleClubManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ClubManagers_UserId",
                table: "ClubManagers");

            migrationBuilder.Sql("""
                DELETE FROM "ClubManagers" manager
                USING "ClubManagers" duplicate
                WHERE manager."UserId" = duplicate."UserId"
                  AND manager."Id" > duplicate."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ClubManagers_UserId",
                table: "ClubManagers",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ClubManagers_UserId",
                table: "ClubManagers");

            migrationBuilder.CreateIndex(
                name: "IX_ClubManagers_UserId",
                table: "ClubManagers",
                column: "UserId");
        }
    }
}
