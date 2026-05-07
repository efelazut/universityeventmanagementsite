import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";

export function OverlayShortcutPage({ type }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openMessages, openNotifications } = useCommunicationCenter();

  useEffect(() => {
    const open = async () => {
      if (type === "messages") {
        await openMessages({ threadId: searchParams.get("thread") });
      } else {
        await openNotifications();
      }

      navigate("/home", { replace: true });
    };

    open();
  }, [navigate, openMessages, openNotifications, searchParams, type]);

  return <div className="loading-state loading-state-large">Panel açılıyor...</div>;
}
