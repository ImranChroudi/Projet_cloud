import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import API_AUTH from "../api/axiosauth";

function MultiUserSelect({ users, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Support both MySQL (id) and MongoDB (_id) user objects
  const getId = (u) => u._id ?? u.id;

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const removeTag = (id, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        className="ms-input-box"
        onClick={() => { setOpen(true); }}
      >
        {value.length === 0 && (
          <span className="ms-placeholder">Sélectionner des membres...</span>
        )}
        {value.map((id) => {
          const user = users.find((u) => getId(u) === id);
          return user ? (
            <span key={id} className="ms-tag">
              {user.name}
              <button type="button" onClick={(e) => removeTag(id, e)}>×</button>
            </span>
          ) : null;
        })}
        <input
          className="ms-search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          placeholder=""
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="ms-dropdown">
          {filtered.length === 0 ? (
            <div className="ms-empty">Aucun résultat</div>
          ) : (
            filtered.map((u) => {
              const uid = getId(u);
              const isSelected = value.includes(uid);
              return (
                <div
                  key={uid}
                  className={`ms-option ${isSelected ? "selected" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); toggleUser(uid); }}
                >
                  <div className="ms-check">
                    {isSelected && <span>✓</span>}
                  </div>
                  <span>{u.name}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default MultiUserSelect;