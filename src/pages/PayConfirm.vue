<template>
  <div class="pay-confirm">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script>
import { pdf2json } from '@/utils/pdf2json.js'
export default {
  name: 'PayConfirm',
  data() {
    return {
      msg: 'PayConfirm'
    }
  },
  created() {
    this.pdf2json()
  },
  methods: {
    pdf2json: async function () {
      var files = [
        {
          url: '/static/pdf/12-1.pdf',
          pwd: 'LdfFe46m'
        },
        {
          url: '/static/pdf/12-2.pdf',
          pwd: 'dnQsYP7f'
        }
      ];
      var data = await pdf2json(files)
      console.log(data);
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
