/**
 * Closes all open details elements when clicking outside of them.
 * Preserves nested details by keeping open any details element that is an ancestor of the clicked target.
 *
 * @param event - The mouse click event
 */
export function closeDetailsOnOutsideClick(event: MouseEvent) {
  const target = event.target as Element;

  // Get all open details elements
  const openDetails = document.querySelectorAll('details[open]');

  openDetails.forEach((details) => {
    // Check if the clicked target is inside this details element
    const isInsideDetails = details.contains(target);

    if (!isInsideDetails) {
      // Check if this details element is an ancestor of the clicked target
      // (i.e., in the event's bubble path)
      let shouldStayOpen = false;
      let parentElement = target.parentElement;

      while (parentElement) {
        if (parentElement === details) {
          shouldStayOpen = true;
          break;
        }
        parentElement = parentElement.parentElement;
      }

      if (!shouldStayOpen) {
        details.removeAttribute('open');
      }
    }
  });
}
