import { Quill } from 'react-quill';

// Expose Quill to window before other modules that depend on it are imported
if (typeof window !== 'undefined' && !window.Quill) {
    window.Quill = Quill;
}

export default Quill;
