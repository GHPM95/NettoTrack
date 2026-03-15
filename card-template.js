export function createCard({

  header="",
  sub="",
  body="",
  footer=""

}){

  return `

  <div class="ntCard">

    <div class="ntCardHeader">
      ${header}
    </div>

    <div class="ntCardSub">
      ${sub}
    </div>

    <div class="ntCardBody">
      ${body}
    </div>

    <div class="ntCardFooter">
      ${footer}
    </div>

  </div>

  `;

}