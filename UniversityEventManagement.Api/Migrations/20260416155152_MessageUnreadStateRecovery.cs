using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniversityEventManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class MessageUnreadStateRecovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReadAt",
                table: "Messages",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MessageThreadReadStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ThreadId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LastReadAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageThreadReadStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageThreadReadStates_MessageThreads_ThreadId",
                        column: x => x.ThreadId,
                        principalTable: "MessageThreads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MessageThreadReadStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MessageThreadReadStates_ThreadId_UserId",
                table: "MessageThreadReadStates",
                columns: new[] { "ThreadId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MessageThreadReadStates_UserId",
                table: "MessageThreadReadStates",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MessageThreadReadStates");

            migrationBuilder.DropColumn(
                name: "ReadAt",
                table: "Messages");
        }
    }
}
