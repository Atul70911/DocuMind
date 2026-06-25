import { useState } from 'react';
import { useShareLinks, useCreateShareLink, useRevokeShareLink } from '../../hooks/useShareLinks';

export function ShareModal({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const { data } = useShareLinks(documentId);
  const createLink = useCreateShareLink(documentId);
  const revokeLink = useRevokeShareLink(documentId);
  const [allowChat, setAllowChat] = useState(false);

  const publicBaseUrl = window.location.origin;

  return (
    <div className="share-modal" role="dialog" aria-label="Share document">
      <h2>Share this document</h2>

      <label className="share-modal__checkbox">
        <input
          type="checkbox"
          checked={allowChat}
          onChange={(e) => setAllowChat(e.target.checked)}
        />
        Allow visitors to ask questions (uses your AI compute)
      </label>

      <button onClick={() => createLink.mutate({ allowChat })} disabled={createLink.isPending}>
        Create new link
      </button>

      <ul className="share-modal__links">
        {data?.shareLinks
          .filter((link) => !link.expiresAt || new Date(link.expiresAt) > new Date())
          .map((link) => (
            <li key={link._id}>
              <code>{`${publicBaseUrl}/shared/${link.token}`}</code>
              <span>{link.allowChat ? 'Chat enabled' : 'View only'}</span>
              <button onClick={() => revokeLink.mutate(link._id)}>Revoke</button>
            </li>
          ))}
      </ul>

      <button onClick={onClose}>Close</button>
    </div>
  );
}