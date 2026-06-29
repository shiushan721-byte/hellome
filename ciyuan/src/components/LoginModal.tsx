import { Modal } from 'antd';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginContent } from './LoginContent';
import './login-modal.scss';

interface LoginModalProps {
  visible?: boolean;
  from?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible: visibleProp, from }) => {
  const { loginModalOpen, setLoginModalOpen } = useAuth();

  return (
    <Modal
      className="login-modal"
      open={visibleProp || loginModalOpen}
      centered
      footer={null}
      destroyOnClose
      width={400}
      zIndex={1100}
      closable={false}
      onCancel={() => setLoginModalOpen(false)}
    >
      <div
        style={{
          margin: '-40px -40px -40px -40px',
          padding: '40px',
          position: 'relative',
          backgroundColor: '#ffffff',
          backgroundImage: 'url(https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/workflow/bg.svg)',
          backgroundSize: '100% auto',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top center',
          borderRadius: '16px',
        }}
      >
        <button
          type="button"
          onClick={() => setLoginModalOpen(false)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            zIndex: 2,
            borderRadius: 4,
            outline: 'none',
          }}
        >
          <img
            src="https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/x.svg"
            alt="Close"
            style={{ width: 16, height: 16 }}
          />
        </button>
        <div className="login-modal-header flex justify-center">
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#131B26' }}>手机号登录</h2>
        </div>

        <div className="login-modal-body">
          <LoginContent from={from} onSuccess={() => setLoginModalOpen(false)} />
        </div>
      </div>
    </Modal>
  );
};

const MemoizedLoginModal = React.memo(LoginModal);
export default MemoizedLoginModal;
