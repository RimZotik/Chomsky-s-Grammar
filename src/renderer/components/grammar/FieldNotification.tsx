import React from "react";

interface FieldNotificationProps {
  message?: string;
  type?: "error" | "warning" | "info";
  show?: boolean;
}

const FieldNotification: React.FC<FieldNotificationProps> = ({
  message,
  type = "error",
  show = true,
}) => {
  if (!show || !message) return null;

  return (
    <div className={`field-notification ${type}`}>
      <span className="notification-icon">
        {type === "error" && "⚠️"}
        {type === "warning" && "⚠️"}
        {type === "info" && "ℹ️"}
      </span>
      <span className="notification-message">{message}</span>
    </div>
  );
};

export default FieldNotification;
