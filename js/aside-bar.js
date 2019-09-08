{
    let view = {
        el: '#asideBar',
        template:`<div class="svg-left active"><svg class="icon" width="128px" height="128.00px" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                    d="M337.87 512.5L771.55 78.82c17.574-17.574 17.574-46.066 0-63.64-17.573-17.573-46.066-17.573-63.64 0L260.796 462.295c-27.727 27.728-27.727 72.682 0 100.41l447.116 447.115c17.573 17.573 46.066 17.573 63.64 0 17.573-17.574 17.573-46.066 0-63.64L337.87 512.5z" />
                </svg>
                </div>
                <div class="svg-right">
                <svg class="icon" width="128px" height="128.00px" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                    d="M686.86 512.5L253.18 78.82c-17.573-17.574-17.573-46.066 0-63.64 17.574-17.573 46.066-17.573 63.64 0l447.115 447.115c27.727 27.728 27.727 72.682 0 100.41L316.82 1009.82c-17.574 17.573-46.066 17.573-63.64 0-17.573-17.574-17.573-46.066 0-63.64L686.86 512.5z" />
                    </svg>
                </div>`,
        render(){
            el(this.el).innerHTML = this.template
        },
        toggle(){
            let isHidden = $(`${this.el}  .svg-left`).classList.contains('active')
            if (isHidden) {
                $(`${this.el}  .svg-left`).classList.remove('active')
                $(`${this.el}  .svg-right`).classList.add('active')

                $('aside').classList.add('active')
            } else {
                $(`${this.el}  .svg-right`).classList.remove('active')
                $(`${this.el}  .svg-left`).classList.add('active')
                
                $('aside').classList.remove('active')
            }
        }
    }

    let model = {}

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
            registEvent(this.view.el, 'click', () => {
                this.view.toggle()
            })

        },
        bindEventHub() {

        }
    }
    controller.init(view, model)
}