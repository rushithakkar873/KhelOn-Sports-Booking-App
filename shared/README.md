# KhelON Shared Components & Services

This directory contains shared code between KhelON Player and KhelON Venue Partner apps.

## Structure

- `components/` - Shared React Native components
- `services/` - Common API services and utilities
- `utils/` - Shared utility functions
- `types/` - TypeScript type definitions shared across apps

## Usage

Import shared components/services in both apps:
```typescript
import { AuthService } from '../../../shared/services/authService';
import { CommonButton } from '../../../shared/components/CommonButton';
```

## Future Considerations

- Can be converted to npm packages for better dependency management
- Consider using a monorepo tool like Lerna or Nx for larger scale