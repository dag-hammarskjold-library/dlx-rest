////////////////////////////////////////////////////////////////
// MERGE ADMINISTRATION COMPONENT
////////////////////////////////////////////////////////////////
export let mergeadmincomponent = {

  props: ["prefix"],

  template:`
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Authorities Merge Management</h1>
        <button v-on:click="refreshData" class="btn btn-primary">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <ul class="nav nav-tabs" id="mergeTab" role="tablist">
        <li class="nav-item">
          <a class="nav-link" :class="{active: activeTab === 'jobs'}" href="#" v-on:click.prevent="activeTab = 'jobs'">Merge Jobs</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{active: activeTab === 'logs'}" href="#" v-on:click.prevent="activeTab = 'logs'">Merge Logs</a>
        </li>
      </ul>

       <div class="tab-content bg-white p-3 border border-top-0">
         <!-- Jobs Tab -->
         <div v-if="activeTab === 'jobs'">
           <div class="mb-3">
             <input type="text" v-model="filters.jobs" class="form-control w-25" placeholder="Filter jobs (ID, user, status)...">
           </div>
           <table class="table table-hover">
             <thead>
               <tr>
                 <th>Job ID</th>
                 <th>Gaining</th>
                 <th>Losing</th>
                 <th>User</th>
                 <th>Status</th>
                 <th>Progress</th>
                 <th>Last Log</th>
                 <th>Created</th>
                 <th>Action</th>
               </tr>
             </thead>
              <tbody >
                <tr v-for="job in filteredJobs" :key="job.job_id">
                  <td><code>{{ job.job_id }}</code></td>
                  <td>{{ job.gaining }}</td>
                  <td>{{ job.losing }}</td>
                  <td>{{ job.user }}</td>
                  <td>
                    <span :class="statusClass(job.status)" class="badge">
                      {{ job.status }}
                    </span>
                  </td>
                  <td>
                    <div class="progress" style="height: 20px;">
                      <div class="progress-bar" role="progressbar" :style="{width: job.progress + '%'}" :aria-valuenow="job.progress" aria-valuemin="0" aria-valuemax="100">{{ job.progress }}%</div>
                    </div>
                    <small class="text-muted">Moves: {{ job.progress }} / {{ job.expected_moves_count || '?' }}</small>
                  </td>
                  <td><small>{{ job.last_log || 'N/A' }}</small></td>
                  <td>{{ formatDate(job.created) }}</td>
                  <td>
                    <div class="btn-group">
                      <button v-if="job.status === 'failed' || job.status === 'running'" class="btn btn-sm btn-outline-warning" v-on:click="resumeJob(job.job_id)">Resume</button>
                      <button v-if="job.status === 'failed'" class="btn btn-sm btn-outline-danger" v-on:click="showError(job)">View Error</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredJobs.length === 0">
                  <td colspan="9" class="text-center">No merge jobs found.</td>
                </tr>
              </tbody>

          </table>
        </div>

         <!-- Logs Tab -->
         <div v-if="activeTab === 'logs'">
           <div class="mb-3">
             <input type="text" v-model="filters.logs" class="form-control w-25" placeholder="Filter logs (ID, action, message)...">
           </div>
           <div class="table-responsive">
            <table class="table table-sm table-striped">
               <thead>
                 <tr>
                   <th>Time</th>
                   <th>Job ID</th>
                   <th>Record ID</th>
                   <th>Action</th>
                   <th>Details</th>
                 </tr>
               </thead>
               <tbody>
                 <tr v-for="log in filteredLogs" :key="log._id">
                   <td>{{ formatDate(log.time) }}</td>
                   <td><small>{{ log.job_id || 'N/A' }}</small></td>
                   <td>{{ log.record_id }}</td>
                   <td><span class="badge badge-secondary">{{ log.action }}</span></td>
                   <td><small>{{ log.message || 'N/A' }}</small></td>
                 </tr>
                 <tr v-if="filteredLogs.length === 0">
                   <td colspan="5" class="text-center">No merge logs found.</td>
                 </tr>
               </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  data: function() {
    return {
      activeTab: 'jobs',
      jobs: [],
      logs: [],
      filters: {
        jobs: '',
        logs: ''
      },
      refreshInterval: null
    }
  },

  created() {
    this.refreshData();
    // Auto-refresh every 5 seconds
    this.refreshInterval = setInterval(this.refreshData, 5000);
  },

  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },

  computed: {
    filteredJobs() {
      const q = this.filters.jobs.toLowerCase();
      return this.jobs.filter(j => 
        j.job_id.toLowerCase().includes(q) || 
        j.user.toLowerCase().includes(q) || 
        j.status.toLowerCase().includes(q)
      );
    },
    filteredLogs() {
      const q = this.filters.logs.toLowerCase();
      return this.logs.filter(l => 
        (l.job_id && l.job_id.toLowerCase().includes(q)) || 
        (l.record_id && l.record_id.toString().toLowerCase().includes(q)) || 
        (l.action && l.action.toLowerCase().includes(q)) || 
        (l.message && l.message.toLowerCase().includes(q))
      );
    }
  },

  methods: {
    async refreshData() {
      try {
        const [jobsRes, logsRes] = await Promise.all([
          fetch(this.prefix + 'admin/merge_jobs'),
          fetch(this.prefix + 'admin/merge_logs')
        ]);

        if (jobsRes.ok) {
          const json = await jobsRes.json();
          this.jobs = json.data || [];
        }

        if (logsRes.ok) {
          const json = await logsRes.json();
          this.logs = json.data || [];
        }
      } catch (error) {
        console.error("Error refreshing merge data:", error);
      }
    },

    statusClass(status) {
      switch(status) {
        case 'completed': return 'badge-success';
        case 'failed': return 'badge-danger';
        case 'running': return 'badge-info';
        case 'queued': return 'badge-secondary';
        default: return 'badge-light';
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleString();
    },

    showError(job) {
      alert("Error for Job " + job.job_id + ":\\n\\n" + (job.error || job.message || "No error message available"));
    },

    async resumeJob(jobId) {
      try {
        const res = await fetch(`${this.prefix}merge_jobs/${jobId}`, { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          this.$root.$refs.messagecomponent.changeStyling(json.data?.message || "Job resumed successfully", "d-flex w-100 alert-success");
          this.refreshData();
        } else {
          const json = await res.json();
          this.$root.$refs.messagecomponent.changeStyling(json.message || "Failed to resume job", "d-flex w-100 alert-danger");
        }
      } catch (error) {
        console.error("Error resuming job:", error);
        this.$root.$refs.messagecomponent.changeStyling("Network error while resuming job", "d-flex w-100 alert-danger");
      }
    }
  }
}
