/* =========================
   NettoTrack Universal Card Manager
   ========================= */

window.NTCardManager = (() => {
  const MAX_OPEN_CARDS = 4;

  function getOpenCards() {
    return [...(window.NTCards?.state?.openCards || [])];
  }

  function getOpenCount() {
    return getOpenCards().length;
  }

  function isOpen(cardId) {
    return !!window.NTCards?.isOpen?.(cardId);
  }

  function canOpenNewCard() {
    return getOpenCount() < MAX_OPEN_CARDS;
  }

  function showMaxCardsModal() {
    if (!window.NTModal?.open) return;

    NTModal.open({
      title: "Troppe card aperte",
      text: "Puoi aprire al massimo 4 card contemporaneamente. Chiudine una prima di proseguire.",
      confirmText: "Ho capito"
    });
  }

  function open(cardId) {
    if (!window.NTCards || !cardId) return false;

    if (NTCards.isOpen(cardId)) {
      NTCards.focusCard(cardId);
      return true;
    }

    if (!canOpenNewCard()) {
      showMaxCardsModal();
      return false;
    }

    return NTCards.openCard(cardId);
  }

  function close(cardId) {
    if (!window.NTCards || !cardId) return false;
    return NTCards.closeCard(cardId);
  }

  function closeActive() {
    if (!window.NTCards) return false;
    return NTCards.closeActiveCard();
  }

  function focus(cardId) {
    if (!window.NTCards || !cardId) return false;
    return NTCards.focusCard(cardId);
  }

  return {
    MAX_OPEN_CARDS,
    open,
    close,
    closeActive,
    focus,
    isOpen,
    getOpenCards,
    getOpenCount,
    canOpenNewCard
  };
})();