import { AddManagerModal } from "./AddManagerModal";
import { ManagerCard } from "./ManagerCard";

export function ClubManagementSection({
  managers,
  users,
  canManage,
  currentUserId,
  modalOpen,
  loading,
  onOpenModal,
  onCloseModal,
  onAssign,
  onRemove
}) {
  return (
    <section className="club-management-section">
      <div className="club-management-head">
        <div>
          <p className="eyebrow">Yönetim Ekibi</p>
          <h2>Yönetim Ekibi</h2>
        </div>
        {canManage ? <button className="primary-button" type="button" onClick={onOpenModal}>Yönetici Ekle</button> : null}
      </div>

      <div className="manager-card-grid">
        {managers.map((manager) => (
          <ManagerCard
            key={manager.id}
            manager={manager}
            canRemove={canManage && manager.role !== "President" && manager.userId !== currentUserId}
            onRemove={onRemove}
          />
        ))}
      </div>

      {!managers.length ? <div className="empty-state-box"><strong>Yönetim ekibi hazırlanıyor.</strong></div> : null}

      <AddManagerModal
        open={modalOpen}
        users={users}
        managers={managers}
        loading={loading}
        onClose={onCloseModal}
        onAssign={onAssign}
      />
    </section>
  );
}
