using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniversityEventManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentNumberUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "StudentNumber" = 'USER' || "Id"
                WHERE "StudentNumber" IS NULL OR btrim("StudentNumber") = '';

                WITH duplicates AS (
                    SELECT "Id",
                           "StudentNumber",
                           row_number() OVER (PARTITION BY lower("StudentNumber") ORDER BY "Id") AS rn
                    FROM "Users"
                )
                UPDATE "Users" AS user_record
                SET "StudentNumber" = duplicates."StudentNumber" || '-' || user_record."Id"
                FROM duplicates
                WHERE user_record."Id" = duplicates."Id" AND duplicates.rn > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Users_StudentNumber",
                table: "Users",
                column: "StudentNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_StudentNumber",
                table: "Users");
        }
    }
}
