/**
 * Encryption Dialog
 *
 * Dialog for creating new SealedSecrets by encrypting secret values
 * client-side using the controller's public certificate
 */

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Add as AddIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useSealedSecretEncryption } from '../hooks/useSealedSecretEncryption';
import { SealedSecret } from '../lib/SealedSecretCRD';
import { SealedSecretScope, SecretKeyValue } from '../types';

interface EncryptDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Encrypt dialog component
 */
export function EncryptDialog({ open, onClose }: EncryptDialogProps) {
  const [name, setName] = React.useState('');
  const [namespace, setNamespace] = React.useState('default');
  const [scope, setScope] = React.useState<SealedSecretScope>('strict');
  const [keyValues, setKeyValues] = React.useState<(SecretKeyValue & { showValue: boolean })[]>([
    { key: '', value: '', showValue: false },
  ]);
  const { enqueueSnackbar } = useSnackbar();
  const { encrypt, encrypting } = useSealedSecretEncryption();

  const [namespaces] = K8s.ResourceClasses.Namespace.useList();

  const handleAddKeyValue = () => {
    setKeyValues([...keyValues, { key: '', value: '', showValue: false }]);
  };

  const handleRemoveKeyValue = (index: number) => {
    setKeyValues(keyValues.filter((_, i) => i !== index));
  };

  const handleKeyChange = (index: number, key: string) => {
    const updated = [...keyValues];
    updated[index].key = key;
    setKeyValues(updated);
  };

  const handleValueChange = (index: number, value: string) => {
    const updated = [...keyValues];
    updated[index].value = value;
    setKeyValues(updated);
  };

  const toggleShowValue = (index: number) => {
    const updated = [...keyValues];
    updated[index].showValue = !updated[index].showValue;
    setKeyValues(updated);
  };

  const handleCreate = async () => {
    // Filter out empty rows
    const validKeyValues = keyValues.filter(kv => kv.key || kv.value).map(kv => ({
      key: kv.key,
      value: kv.value,
    }));

    // Use the encryption hook
    const result = await encrypt({
      name,
      namespace,
      scope,
      keyValues: validKeyValues,
    });

    // If encryption failed, the hook already showed the error
    if (result.ok === false) {
      return;
    }

    try {
      // Apply the SealedSecret to the cluster
      await SealedSecret.apiEndpoint.post(result.value.sealedSecretData);

      enqueueSnackbar('SealedSecret created successfully', { variant: 'success' });

      // Clear form and close
      setName('');
      setNamespace('default');
      setScope('strict');
      setKeyValues([{ key: '', value: '', showValue: false }]);
      onClose();
    } catch (error: any) {
      enqueueSnackbar(`Failed to create SealedSecret: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Sealed Secret</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Secret Name"
            value={name}
            onChange={e => setName(e.target.value)}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Namespace</InputLabel>
            <Select
              value={namespace}
              label="Namespace"
              onChange={e => setNamespace(e.target.value)}
            >
              {namespaces?.map(ns => (
                <MenuItem key={ns.metadata.name} value={ns.metadata.name}>
                  {ns.metadata.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Scope</InputLabel>
            <Select value={scope} label="Scope" onChange={e => setScope(e.target.value as SealedSecretScope)}>
              <MenuItem value="strict">Strict (name + namespace bound)</MenuItem>
              <MenuItem value="namespace-wide">Namespace-wide (namespace bound)</MenuItem>
              <MenuItem value="cluster-wide">Cluster-wide (no binding)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Secret Data
          </Typography>

          {keyValues.map((kv, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Key Name"
                value={kv.key}
                onChange={e => handleKeyChange(index, e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Secret Value"
                type={kv.showValue ? 'text' : 'password'}
                value={kv.value}
                onChange={e => handleValueChange(index, e.target.value)}
                sx={{ flex: 2 }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => toggleShowValue(index)} edge="end">
                      {kv.showValue ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <IconButton
                onClick={() => handleRemoveKeyValue(index)}
                disabled={keyValues.length === 1}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          <Button startIcon={<AddIcon />} onClick={handleAddKeyValue}>
            Add Another Key
          </Button>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Security Note:</strong> Secret values are encrypted entirely in your browser
              using the controller's public key. The plaintext values never leave your machine.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={encrypting}>
          Cancel
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={encrypting}>
          {encrypting ? 'Encrypting & Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
