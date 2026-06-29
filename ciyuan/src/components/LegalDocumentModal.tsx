import { Modal } from 'antd';
import React, { useCallback, memo } from 'react';

// 复用协议页样式，使弹窗内正文与 gnomic web-core 一致
import '../pages/terms-of-service/index.scss';
import '../pages/privacy-policyPage/index.scss';

interface LegalDocumentModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const LegalDocumentModal = memo(({ open, onClose, children }: LegalDocumentModalProps) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      closable={true}
      closeIcon={
        <img
          src="https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/x.svg"
          alt="Close"
          className="legal-document-modal-close-icon w-4 h-4"
        />
      }
      onCancel={handleClose}
      width={'60vw'}
      style={{ maxWidth: '1200px' }}
      centered
      className="legal-document-modal"
      styles={{
        body: {
          padding: '0 32px',
          maxHeight: '70vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div className="flex flex-col">{children}</div>
    </Modal>
  );
});

LegalDocumentModal.displayName = 'LegalDocumentModal';
