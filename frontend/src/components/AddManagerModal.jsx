import { useMemo, useState } from "react";

export function AddManagerModal({ open, users, managers, loading, onClose, onAssign }) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const managerIds = useMemo(() => new Set(managers.map((manager) => manager.userId)), [managers]);
  const filteredUsers = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("tr-TR");
    return users
      .filter((user) => !managerIds.has(user.id))
      .filter((user) => {
        if (!value) return true;
        return `${user.fullName} ${user.email}`.toLocaleLowerCase("tr-TR").includes(value);
      })
      .slice(0, 8);
  }, [managerIds, query, users]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="add-manager-modal" role="dialog" aria-modal="true" aria-labelledby="add-manager-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Yönetim Ekibi</p>
            <h2 id="add-manager-title">Yönetici Ekle</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>Kapat</button>
        </div>

        <label className="filter-field">
          İsim veya e-posta ara
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Örn. Ahmet veya ahmet@mail.com" />
        </label>

        <div className="manager-search-list">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              className={`manager-search-row ${Number(selectedUserId) === user.id ? "is-selected" : ""}`}
              type="button"
              onClick={() => setSelectedUserId(String(user.id))}
            >
              <span>{user.fullName?.slice(0, 1) || "U"}</span>
              <div>
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
              </div>
            </button>
          ))}
          {!filteredUsers.length ? <div className="notice-box">Uygun kullanıcı bulunamadı veya herkes zaten ekipte.</div> : null}
        </div>

        <button className="primary-button" type="button" disabled={!selectedUserId || loading} onClick={() => onAssign(Number(selectedUserId))}>
          {loading ? "Atanıyor..." : "Yönetici Olarak Ata"}
        </button>
      </section>
    </div>
  );
}
