import React, { useState, useEffect } from 'react';
import { Form, Button, Spin, Drawer, Space, Alert } from 'antd';
import ClientTypeSelector from './seleccionTypeCliente';
import NaturalPersonForm from './personaNaturalFormulario';
import CompanyForm from './empresaFormulario';
import { ClientFormData, ClientType, client } from '../Types/clienteTypes';

import { useListCliente } from '../Hooks/useListCliente';

interface AgregarClienteDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: client) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const AgregarClienteDrawer: React.FC<AgregarClienteDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
  showToast
}) => {
  const [clientType, setClientType] = useState<ClientType>(2);
  const [form] = Form.useForm<ClientFormData>();
  const { registerNewClient, isLoading, errorCliente, success, clearError, } = useListCliente();

  // Reset estados cuando el drawer se abre/cierra
  useEffect(() => {
    if (visible) {
      form.resetFields();
      clearError();
    }
  }, [visible, clearError, form]);

  const handleClose = () => {
    form.resetFields();
    clearError();
    onClose();
  };

  const onFinish = async (values: ClientFormData) => {
    try {
      const result = await registerNewClient(values, clientType);
      form.resetFields();
      
      if (showToast) {
        const clientTypeText = clientType === 2 ? 'Persona Natural' : 'Empresa';
        showToast(`Cliente ${clientTypeText} registrado correctamente`, 'success');
      }
      
      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Error en el formulario:', err);
      if (showToast) {
        showToast(errorCliente ? `Error al registrar cliente: ${errorCliente}` : 'Error al registrar cliente', 'error');
      }
    }
  };

  return (
    <Drawer
      title="Registro de Cliente"
      placement="right"
      onClose={handleClose}
      open={visible}
      width={500}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isLoading}
            disabled={isLoading}
          >
            Registrar Cliente
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading}>
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          {success && (
            <Alert 
              message="Operación Exitosa" 
              description="Cliente registrado correctamente" 
              type="success" 
              showIcon 
              closable 
            />
          )}
          
          {errorCliente && (
            <Alert 
              message="Error" 
              description={`Error al registrar cliente: ${errorCliente}`} 
              type="error" 
              showIcon 
              closable 
              onClose={clearError}
            />
          )}
        </Space>

        <Form<ClientFormData>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ type: clientType }}
        >
          <ClientTypeSelector 
            value={clientType}
            onChange={(value: ClientType) => setClientType(value)}
            disabled={isLoading}
          />
          
          {clientType === 2 ? (
            <NaturalPersonForm />
          ) : (
            <CompanyForm />
          )}
        </Form>
      </Spin>
    </Drawer>
  );
};

export default AgregarClienteDrawer;