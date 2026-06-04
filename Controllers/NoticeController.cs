using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusTicketingBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NoticeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NoticeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/notice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notice>>> GetNotices()
        {
            return await _context.Notices
                .OrderBy(n => n.NoticeNumber)
                .ToListAsync();
        }

        // GET: api/notice/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Notice>> GetNotice(int id)
        {
            var notice = await _context.Notices.FindAsync(id);

            if (notice == null)
            {
                return NotFound(new { message = "Notice not found." });
            }

            return notice;
        }

        // POST: api/notice
        [HttpPost]
        public async Task<ActionResult<Notice>> PostNotice([FromBody] Notice notice)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Notices.Add(notice);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNotice), new { id = notice.Id }, notice);
        }

        // PUT: api/notice/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNotice(int id, [FromBody] Notice notice)
        {
            if (id != notice.Id)
            {
                return BadRequest(new { message = "Notice ID mismatch." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Entry(notice).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await NoticeExists(id))
                {
                    return NotFound(new { message = "Notice not found." });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Notice updated successfully!", notice });
        }

        // DELETE: api/notice/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotice(int id)
        {
            var notice = await _context.Notices.FindAsync(id);
            if (notice == null)
            {
                return NotFound(new { message = "Notice not found." });
            }

            _context.Notices.Remove(notice);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notice deleted successfully!" });
        }

        private async Task<bool> NoticeExists(int id)
        {
            return await _context.Notices.AnyAsync(e => e.Id == id);
        }
    }
}
