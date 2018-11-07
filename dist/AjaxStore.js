import axios from 'axios';

/**
 * Ajax store, handle the sync with the server, and cache the results in the store.
 */
class AjaxStore {
    /**
     * Set the variables.
     *
     * @param {object} options
     */
    constructor(options = {}) {
        this.store = options.store || [];
        this.route = options.route || null;
        this.name = options.name || 'base';
    }

    /**
     * Get the storage name.
     *
     * @return {string}
     */
    get storageName() {
        return 'ajax_store_' + this.name;
    }

    /**
     * Get and cache the orders from the server.
     *
     * @return {Promise}
     */
    getAll() {
        let component = this;

        if (!this.store.length) {
            if (this.name && sessionStorage.getItem(component.storageName)) {
                this.store = JSON.parse(sessionStorage.getItem(component.storageName));
            } else {
                this.store = [];
            }
        }

        if (this.store.length) {
            return new Promise(this.checkStore.bind(component));
        }

        return this.renew();
    }

    /**
     * Get a single item.
     *
     * @param {object} key, value
     *
     * @return {Promise}
     */
    getSingle({
        key, value
    }) {
        return this.getAll().then(items => {
            const singleItem = items.find(item => item[key] == value);

            return new Promise((resolve, reject) => {
                if (singleItem) {
                    resolve(singleItem);
                } else {
                    reject(new Error('Item not found (' + key + ':' + value + ')'));
                }
            });
        });
    }

    /**
     * Wait for the orders in the store.
     *
     * @param {function} resolve
     * @param {function} reject
     */
    checkStore(resolve, reject) {
        let component = this;

        if (this.store.length < 1) {
            reject(new Error('Store is empty'));
        }

        let check = () => {
            if (component.store && component.store.length) {
                resolve(component.store);
            }
            setTimeout(check, 100);
        };

        check();

        this.renew();
    }

    /**
     * Get the information, store in the store.
     *
     * @return {Promise}
     */
    renew() {
        let component = this;

        if (!this.route) {
            return;
        }

        return axios
            .get(this.route)
            .then(response => {
                if (component.name) {
                    sessionStorage.setItem(component.storageName, JSON.stringify(response.data));
                }

                return (component.store = response.data);
            })
            .catch(error => Promise.reject(error));
    }
}

export default AjaxStore;
