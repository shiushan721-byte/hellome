import { useState } from 'react';
import '../marketing.css';

const WECHAT_ICON_SRC = '/w-chat.png';
const GROUP_QR_SRC = '/ciyuan.png';

export function FloatingGroupChat() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`marketing-floating-group-chat${open ? ' marketing-floating-group-chat--open' : ''}`}
      aria-label="加入群聊"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="marketing-floating-group-chat__popover" role="tooltip">
        <div className="marketing-floating-group-chat__popover-card">
          <img
            src={GROUP_QR_SRC}
            alt="词元工场交流群二维码"
            className="marketing-floating-group-chat__qr"
            width={176}
            height={176}
            decoding="async"
          />
        </div>
      </div>
      <div className="marketing-floating-group-chat__trigger">
        <img
          src={WECHAT_ICON_SRC}
          alt=""
          className="marketing-floating-group-chat__icon"
          width={28}
          height={28}
          aria-hidden
        />
        <span className="marketing-floating-group-chat__label">加入群聊</span>
      </div>
    </div>
  );
}
