import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

import SupportContactModal from './SupportContactModal';
import '../api-hub.css';

export default function FloatingSupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="api-hub-floating-support"
        onClick={() => setOpen(true)}
      >
        <MessageCircle size={18} strokeWidth={2} aria-hidden />
        联系客服
      </button>
      <SupportContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
