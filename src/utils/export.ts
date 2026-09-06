import { JournalSession } from '../types';

export function exportSessionToJSON(session: JournalSession) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanTitle = (session.title || 'journal-entry').toLowerCase().replace(/[^a-z0-9]/g, '-');
  downloadAnchor.setAttribute('download', `${cleanTitle}-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportAllSessionsToJSON(sessions: JournalSession[], userEmail: string | null) {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: userEmail,
    totalSessions: sessions.length,
    sessions,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `mindecho-all-journals-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function printSessionToPDF(session: JournalSession) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export to PDF / Print.');
    return;
  }

  const tagsHtml = (session.tags || [])
    .map(
      (t) =>
        `<span style="display:inline-block; padding:3px 10px; margin-right:6px; margin-bottom:6px; background:#f1f5f9; color:#334155; border-radius:9999px; font-size:12px; font-weight:600;">#${t}</span>`
    )
    .join('');

  const messagesHtml = (session.messages || [])
    .map((msg) => {
      const isUser = msg.role === 'user';
      const roleLabel = isUser ? 'You (Journal Entry)' : 'MindEcho (Reflection)';
      const bg = isUser ? '#f8fafc' : '#ffffff';
      const border = isUser ? '#cbd5e1' : '#e2e8f0';
      const moodTags = !isUser && msg.tags && msg.tags.length > 0
        ? `<div style="margin-top:10px;">${msg.tags.map((t) => `<span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:12px; margin-right:4px;">${t}</span>`).join('')}</div>`
        : '';
      const voiceBadge = msg.isVoiceEntry
        ? '<span style="font-size:11px; color:#64748b; margin-left:8px;">[Transcribed from Voice]</span>'
        : '';

      return `
        <div style="margin-bottom:20px; padding:16px 20px; border-radius:8px; background:${bg}; border:1px solid ${border};">
          <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>${roleLabel} ${voiceBadge}</span>
            <span>${new Date(msg.timestamp).toLocaleString()}</span>
          </div>
          <div style="font-size:14px; line-height:1.65; color:#1e293b; white-space:pre-wrap;">${msg.text}</div>
          ${moodTags}
        </div>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${session.title || 'Journal Reflection'}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
          }
          h1 { font-size: 24px; margin-bottom: 6px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; }
          .tags-container { margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <h1>${session.title || 'MindEcho Journal Reflection'}</h1>
        <div class="meta">
          Recorded on ${new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          ${session.dominantSentiment ? ` &bull; Dominant Vibe: <strong>${session.dominantSentiment}</strong>` : ''}
        </div>
        <div class="tags-container">
          ${tagsHtml}
        </div>
        <div class="conversation">
          ${messagesHtml}
        </div>
        <div style="margin-top:40px; font-size:11px; text-align:center; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:16px;">
          Exported from MindEcho &bull; Private & Encrypted AI Reflection
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
